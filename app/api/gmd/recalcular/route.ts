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

  const body = await request.json().catch(() => ({}));
  const fazendaId: string | undefined = body?.fazendaId;
  if (!fazendaId) {
    return NextResponse.json({ error: 'fazendaId obrigatório' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!fazenda) {
    return NextResponse.json({ error: 'Fazenda não encontrada' }, { status: 404 });
  }

  const animais = await prisma.animal.findMany({
    where: { fazendaId, status: 'ativo' },
    select: {
      id: true,
      pesoAtualKg: true,
      gmdAtual: true,
      pesagens: {
        orderBy: { data: 'desc' },
        take: 2,
        select: { pesoKg: true, data: true },
      },
    },
  });

  let atualizados = 0;
  for (const a of animais) {
    const [ultima, anterior] = a.pesagens;
    if (!ultima) continue;

    let gmd: number | null = null;
    if (anterior) {
      const dias =
        (new Date(ultima.data).getTime() - new Date(anterior.data).getTime()) /
        (1000 * 60 * 60 * 24);
      if (dias > 0) {
        gmd = (ultima.pesoKg - anterior.pesoKg) / dias;
      }
    }

    const mudouPeso = a.pesoAtualKg !== ultima.pesoKg;
    const mudouGmd = (a.gmdAtual ?? null) !== gmd;
    if (!mudouPeso && !mudouGmd) continue;

    await prisma.animal.update({
      where: { id: a.id },
      data: {
        pesoAtualKg: ultima.pesoKg,
        gmdAtual: gmd,
      },
    });

    await prisma.logAuditoria.create({
      data: {
        userId: session.user.id,
        fazendaId,
        acao: 'recalcular_gmd',
        entidade: 'Animal',
        entidadeId: a.id,
        dadosAntes: { pesoAtualKg: a.pesoAtualKg, gmdAtual: a.gmdAtual },
        dadosDepois: { pesoAtualKg: ultima.pesoKg, gmdAtual: gmd },
      },
    });

    atualizados++;
  }

  return NextResponse.json({ ok: true, atualizados });
}
