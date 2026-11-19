import { prisma } from '@/lib/prisma';

export async function logAudit(opts: {
  userId: string;
  fazendaId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.logAuditoria.create({
      data: {
        userId: opts.userId,
        fazendaId: opts.fazendaId ?? null,
        acao: opts.acao,
        entidade: opts.entidade,
        entidadeId: opts.entidadeId ?? null,
        dadosAntes: (opts.dadosAntes as never) ?? undefined,
        dadosDepois: (opts.dadosDepois as never) ?? undefined,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch {
    // auditoria nunca deve quebrar a request principal
  }
}
