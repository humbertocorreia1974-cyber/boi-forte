import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const acao = url.searchParams.get('acao') || undefined;
  const entidade = url.searchParams.get('entidade') || undefined;
  const take = Math.min(100, Number(url.searchParams.get('take') || '50'));

  const logs = await prisma.logAuditoria.findMany({
    where: {
      userId: session.user.id,
      ...(acao ? { acao } : {}),
      ...(entidade ? { entidade } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return NextResponse.json({ logs });
}
