import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const fazendaId = url.searchParams.get('fazendaId');
  if (!fazendaId) {
    return NextResponse.json({ error: 'fazendaId obrigatório' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
  });
  if (!fazenda) {
    return NextResponse.json({ error: 'Fazenda não encontrada' }, { status: 404 });
  }

  const animais = await prisma.animal.findMany({
    where: { fazendaId, status: 'ativo' },
    include: { pesagens: { orderBy: { data: 'asc' } }, lote: true },
  });

  const resultado = animais.map((a) => {
    let gmd: number | null = null;
    if (a.pesagens.length >= 2) {
      const first = a.pesagens[0];
      const last = a.pesagens[a.pesagens.length - 1];
      const dias = (last.data.getTime() - first.data.getTime()) / 86400000;
      if (dias > 0) gmd = (last.pesoKg - first.pesoKg) / dias;
    }
    return {
      animalId: a.id,
      brinco: a.brinco,
      loteId: a.loteId,
      loteNome: a.lote?.nome ?? null,
      pesoAtualKg: a.pesoAtualKg,
      gmd,
      pesagens: a.pesagens.length,
    };
  });

  return NextResponse.json({ fazendaId, animais: resultado });
}
