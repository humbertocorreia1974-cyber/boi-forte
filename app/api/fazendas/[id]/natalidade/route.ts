import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const fazenda = await prisma.fazenda.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, nome: true },
  });
  if (!fazenda) {
    return NextResponse.json({ error: 'Fazenda não encontrada' }, { status: 404 });
  }

  const partos = await prisma.parto.findMany({
    where: { mae: { fazendaId: id } },
    select: { safra: true, dataParto: true, bezerroId: true },
  });

  const matrizesAtivas = await prisma.animal.count({
    where: { fazendaId: id, sexo: 'F', status: 'ativo', categoria: { in: ['matriz', 'vaca'] } },
  });

  const map = new Map<string, { safra: string; partos: number; bezerros: number }>();
  for (const p of partos) {
    const safra = p.safra ?? String(new Date(p.dataParto).getFullYear());
    const cur = map.get(safra) ?? { safra, partos: 0, bezerros: 0 };
    cur.partos += 1;
    if (p.bezerroId) cur.bezerros += 1;
    map.set(safra, cur);
  }

  const safras = Array.from(map.values())
    .sort((a, b) => b.safra.localeCompare(a.safra))
    .map((s) => ({
      ...s,
      taxa: matrizesAtivas > 0 ? (s.partos / matrizesAtivas) * 100 : 0,
    }));

  return NextResponse.json({
    fazenda,
    matrizesAtivas,
    safras,
    totalPartos: partos.length,
  });
}
