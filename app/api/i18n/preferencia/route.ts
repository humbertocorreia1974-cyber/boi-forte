import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID = new Set([
  'pt-BR', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ru', 'ar',
  'hi', 'id', 'nl', 'pl', 'tr', 'ko', 'th', 'vi',
]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: { locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const locale = String(body.locale ?? '');
  if (!VALID.has(locale)) {
    return NextResponse.json({ error: 'Locale não suportado' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  await prisma.perfil.updateMany({
    where: { userId: session.user.id },
    data: { idioma: locale },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'update',
      entidade: 'User',
      entidadeId: session.user.id,
      dadosDepois: { locale },
    },
  });

  return NextResponse.json({ ok: true, locale });
}
