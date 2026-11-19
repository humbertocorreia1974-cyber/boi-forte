import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { id } = await params;
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      fazenda: { select: { ownerId: true } },
      mae: true,
      pai: true,
      filhosComoMae: true,
      filhosComoPai: true,
    },
  });
  if (!animal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (animal.fazenda.ownerId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }
  return NextResponse.json({ animal });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const maeId = body?.maeId ? String(body.maeId) : null;
  const paiId = body?.paiId ? String(body.paiId) : null;

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: { fazenda: { select: { ownerId: true } } },
  });
  if (!animal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (animal.fazenda.ownerId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  if (maeId === id || paiId === id) {
    return NextResponse.json({ error: 'Animal não pode ser pai/mãe de si mesmo' }, { status: 400 });
  }

  const atualizado = await prisma.animal.update({
    where: { id },
    data: { maeId, paiId },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: animal.fazendaId,
      acao: 'update',
      entidade: 'Animal',
      entidadeId: animal.id,
      dadosAntes: { maeId: animal.maeId, paiId: animal.paiId },
      dadosDepois: { maeId: atualizado.maeId, paiId: atualizado.paiId },
    },
  });

  return NextResponse.json({ ok: true, animal: atualizado });
}
