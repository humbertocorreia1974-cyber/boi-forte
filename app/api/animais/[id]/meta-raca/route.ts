import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
  const pesoAlvoKg = Number(body?.pesoAlvoKg);
  if (!Number.isFinite(pesoAlvoKg) || pesoAlvoKg <= 0) {
    return NextResponse.json({ error: 'Peso alvo inválido' }, { status: 400 });
  }

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: { fazenda: { select: { ownerId: true } } },
  });
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 });
  if (animal.fazenda.ownerId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const atualizado = await prisma.animal.update({
    where: { id },
    data: { pesoAlvoKg },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: animal.fazendaId,
      acao: 'update',
      entidade: 'Animal',
      entidadeId: animal.id,
      dadosAntes: { pesoAlvoKg: animal.pesoAlvoKg },
      dadosDepois: { pesoAlvoKg: atualizado.pesoAlvoKg },
    },
  });

  return NextResponse.json({ ok: true, animal: atualizado });
}
