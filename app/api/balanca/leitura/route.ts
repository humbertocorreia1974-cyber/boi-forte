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

  let body: { fazendaId?: string; brinco?: string; pesoKg?: number; origem?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const fazendaId = String(body.fazendaId ?? '');
  const brinco = String(body.brinco ?? '').trim();
  const pesoKg = Number(body.pesoKg);
  const origem = body.origem === 'bluetooth' ? 'bluetooth' : 'balanca';

  if (!fazendaId || !brinco || !Number.isFinite(pesoKg) || pesoKg <= 0 || pesoKg > 2000) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!fazenda) {
    return NextResponse.json({ error: 'Fazenda não encontrada' }, { status: 404 });
  }

  const animal = await prisma.animal.findFirst({
    where: { fazendaId, brinco, status: 'ativo' },
    select: { id: true, pesoAtualKg: true },
  });
  if (!animal) {
    return NextResponse.json({ error: 'Animal não encontrado pelo brinco' }, { status: 404 });
  }

  const ultima = await prisma.pesagem.findFirst({
    where: { animalId: animal.id },
    orderBy: { data: 'desc' },
    select: { pesoKg: true, data: true },
  });

  let gmd: number | null = null;
  if (ultima) {
    const dias = Math.max(1, (Date.now() - new Date(ultima.data).getTime()) / 86400000);
    gmd = (pesoKg - ultima.pesoKg) / dias;
  }

  const pesagem = await prisma.pesagem.create({
    data: {
      animalId: animal.id,
      pesoKg,
      gmd,
      origem,
      usuarioId: session.user.id,
    },
  });

  await prisma.animal.update({
    where: { id: animal.id },
    data: { pesoAtualKg: pesoKg, gmdAtual: gmd ?? undefined },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId,
      acao: 'create',
      entidade: 'Pesagem',
      entidadeId: pesagem.id,
      dadosDepois: { pesoKg, origem, brinco },
    },
  });

  return NextResponse.json({ ok: true, pesagemId: pesagem.id, gmd });
}
