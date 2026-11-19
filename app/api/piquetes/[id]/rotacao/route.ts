import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const piquete = await prisma.piquete.findUnique({
    where: { id: params.id },
    include: { fazenda: true },
  });
  if (!piquete || piquete.fazenda.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Piquete não encontrado' }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    tipo?: 'entrada' | 'saida';
    loteId?: string;
    observacao?: string;
  };

  if (body.tipo !== 'entrada' && body.tipo !== 'saida') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  const agora = new Date();
  const aberto = await prisma.historicoRotacao.findFirst({
    where: { piqueteId: piquete.id, saidaEm: null },
    orderBy: { entradaEm: 'desc' },
  });

  if (body.tipo === 'entrada') {
    if (aberto) {
      return NextResponse.json(
        { error: 'Piquete já está ocupado' },
        { status: 409 },
      );
    }
    const criado = await prisma.historicoRotacao.create({
      data: {
        piqueteId: piquete.id,
        loteId: body.loteId || null,
        entradaEm: agora,
        observacao: body.observacao,
      },
    });
    await prisma.piquete.update({
      where: { id: piquete.id },
      data: { status: 'ocupado', ultimaOcupacao: agora },
    });
    await prisma.logAuditoria.create({
      data: {
        userId: session.user.id,
        fazendaId: piquete.fazendaId,
        acao: 'rotacao.entrada',
        entidade: 'HistoricoRotacao',
        entidadeId: criado.id,
        dadosDepois: { piqueteId: piquete.id, loteId: body.loteId ?? null },
      },
    });
    return NextResponse.json({ ok: true, id: criado.id });
  }

  if (!aberto) {
    return NextResponse.json(
      { error: 'Piquete não está ocupado' },
      { status: 409 },
    );
  }

  const diasOcupacao = Math.max(
    0,
    Math.floor((agora.getTime() - aberto.entradaEm.getTime()) / 86400000),
  );

  const fechado = await prisma.historicoRotacao.update({
    where: { id: aberto.id },
    data: { saidaEm: agora, diasOcupacao },
  });

  await prisma.piquete.update({
    where: { id: piquete.id },
    data: { status: 'descanso', ultimoDescanso: agora },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: piquete.fazendaId,
      acao: 'rotacao.saida',
      entidade: 'HistoricoRotacao',
      entidadeId: fechado.id,
      dadosDepois: { diasOcupacao },
    },
  });

  return NextResponse.json({ ok: true, id: fechado.id, diasOcupacao });
}
