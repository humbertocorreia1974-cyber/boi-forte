import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const idem = request.headers.get('Idempotency-Key');
  if (!idem) return NextResponse.json({ error: 'Header Idempotency-Key obrigatório' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const animalId = String(body.animalId ?? '');
  const pesoKg = Number(body.pesoKg ?? 0);
  const data = body.data ? new Date(body.data) : new Date();
  const observacao = body.observacao ? String(body.observacao) : null;

  if (!animalId || !Number.isFinite(pesoKg) || pesoKg <= 0) {
    return NextResponse.json({ error: 'animalId e pesoKg válidos são obrigatórios' }, { status: 400 });
  }

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, fazenda: { ownerId: session.user.id } },
    select: { id: true, fazendaId: true },
  });
  if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 });

  const anterior = await prisma.pesagem.findFirst({
    where: { animalId },
    orderBy: { data: 'desc' },
    select: { pesoKg: true, data: true },
  });

  let gmd: number | null = null;
  if (anterior) {
    const dias = (data.getTime() - new Date(anterior.data).getTime()) / 86400000;
    if (dias > 0) gmd = (pesoKg - anterior.pesoKg) / dias;
  }

  const pesagem = await prisma.pesagem.create({
    data: {
      animalId,
      pesoKg,
      data,
      gmd,
      origem: 'manual',
      observacao,
      usuarioId: session.user.id,
    },
  });

  await prisma.animal.update({
    where: { id: animalId },
    data: { pesoAtualKg: pesoKg, gmdAtual: gmd ?? undefined },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: animal.fazendaId,
      acao: 'criar',
      entidade: 'Pesagem',
      entidadeId: pesagem.id,
      dadosDepois: { animalId, pesoKg, data: data.toISOString(), gmd },
    },
  });

  return NextResponse.json({ ok: true, pesagem, gmd });
}
