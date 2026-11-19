import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ fazendas });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.nome !== 'string' || body.nome.trim().length < 2) {
    return NextResponse.json({ error: 'Nome da fazenda é obrigatório.' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.create({
    data: {
      ownerId: session.user.id,
      nome: body.nome.trim(),
      cnpj: body.cnpj || null,
      cidade: body.cidade || null,
      uf: body.uf || null,
      areaTotalHa: typeof body.areaTotalHa === 'number' ? body.areaTotalHa : null,
    },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId: fazenda.id,
      acao: 'criar',
      entidade: 'Fazenda',
      entidadeId: fazenda.id,
      dadosDepois: { nome: fazenda.nome, cidade: fazenda.cidade, uf: fazenda.uf },
    },
  });

  return NextResponse.json({ fazenda }, { status: 201 });
}
