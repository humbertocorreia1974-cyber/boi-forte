import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  const ids = fazendas.map((f) => f.id);

  const pendentes = await prisma.pesagem.findMany({
    where: {
      animal: { fazendaId: { in: ids } },
      origem: 'offline',
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      pesoKg: true,
      createdAt: true,
      observacao: true,
      animal: { select: { brinco: true } },
    },
  });

  return NextResponse.json({
    total: pendentes.length,
    items: pendentes,
  });
}
