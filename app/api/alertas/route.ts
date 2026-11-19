import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true },
  });
  const ids = fazendas.map((f) => f.id);

  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + 30);

  const [insumos, aplicacoes] = await Promise.all([
    prisma.insumo.findMany({
      where: { fazendaId: { in: ids } },
      orderBy: { quantidadeAtual: 'asc' },
    }),
    prisma.aplicacaoSanitaria.findMany({
      where: {
        animal: { fazendaId: { in: ids } },
        dataVencimento: { lte: limite },
      },
      include: { animal: { select: { brinco: true, fazendaId: true } }, protocolo: { select: { nome: true } } },
      orderBy: { dataVencimento: 'asc' },
      take: 100,
    }),
  ]);

  const estoqueCritico = insumos.filter((i) => i.quantidadeAtual <= i.estoqueMinimo);
  const sanidadeVencendo = aplicacoes;

  return NextResponse.json({ estoqueCritico, sanidadeVencendo, fazendas });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { tipo, titulo, mensagem, fazendaId } = body as {
    tipo?: string; titulo?: string; mensagem?: string; fazendaId?: string;
  };

  if (!titulo || !mensagem) {
    return NextResponse.json({ error: 'titulo e mensagem obrigatórios' }, { status: 400 });
  }

  const notif = await prisma.notification.create({
    data: {
      userId: session.user.id,
      titulo,
      mensagem,
      tipo: tipo ?? 'alerta',
      canal: 'push',
      payload: fazendaId ? { fazendaId } : undefined,
    },
  });

  try {
    await sendEmail({
      to: session.user.email ?? '',
      subject: `[Boi Forte] ${titulo}`,
      html: `<p>${mensagem}</p>`,
    });
  } catch {
    // e-mail é best-effort
  }

  return NextResponse.json({ ok: true, id: notif.id });
}
