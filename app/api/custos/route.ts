import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const form = await request.formData();
  const fazendaId = String(form.get('fazendaId') ?? '');
  const categoria = String(form.get('categoria') ?? '');
  const valor = Number(form.get('valor') ?? 0);
  const descricao = String(form.get('descricao') ?? '') || null;
  const loteIdRaw = String(form.get('loteId') ?? '');
  const loteId = loteIdRaw || null;

  if (!fazendaId || !categoria || !Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!fazenda) {
    return NextResponse.json({ error: 'Fazenda não encontrada' }, { status: 404 });
  }

  if (loteId) {
    const lote = await prisma.lote.findFirst({
      where: { id: loteId, fazendaId: fazenda.id },
      select: { id: true },
    });
    if (!lote) {
      return NextResponse.json({ error: 'Lote inválido' }, { status: 400 });
    }
  }

  const custo = await prisma.custo.create({
    data: {
      fazendaId: fazenda.id,
      loteId,
      categoria,
      descricao,
      valor,
      rateioAutomatico: loteId === null,
      usuarioId: session.user.id,
    },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: fazenda.id,
      acao: 'criar',
      entidade: 'Custo',
      entidadeId: custo.id,
      dadosDepois: { categoria, valor, loteId },
    },
  });

  return NextResponse.redirect(
    new URL(`/custo-arroba?fazendaId=${fazenda.id}`, request.url),
    { status: 303 },
  );
}
