import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { fazendaId, tipo, formato, parametros } = body as {
    fazendaId?: string;
    tipo?: string;
    formato?: string;
    parametros?: Record<string, unknown>;
  };

  if (!fazendaId || !tipo) {
    return NextResponse.json({ error: 'fazendaId e tipo obrigatórios' }, { status: 400 });
  }

  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!fazenda) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const rel = await prisma.relatorio.create({
    data: {
      fazendaId,
      usuarioId: session.user.id,
      tipo,
      formato: formato === 'excel' ? 'excel' : 'pdf',
      parametros: (parametros ?? {}) as object,
      status: 'pronto',
      urlArquivo: `/api/relatorios/placeholder/download`,
    },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      fazendaId,
      acao: 'criar',
      entidade: 'Relatorio',
      entidadeId: rel.id,
      dadosDepois: { tipo, formato } as object,
    },
  });

  return NextResponse.json({ ok: true, id: rel.id });
}
