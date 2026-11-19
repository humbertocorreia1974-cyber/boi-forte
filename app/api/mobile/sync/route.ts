import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Item = {
  key: string;
  fazendaId: string;
  animalBrinco: string;
  pesoKg: number;
  criadoEm: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: { items?: Item[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 500) : [];
  if (items.length === 0) {
    return NextResponse.json({ accepted: [], duplicated: [], failed: [] });
  }

  const fazendaIds = Array.from(new Set(items.map((i) => i.fazendaId)));
  const fazendas = await prisma.fazenda.findMany({
    where: { id: { in: fazendaIds }, ownerId: session.user.id },
    select: { id: true },
  });
  const permitidas = new Set(fazendas.map((f) => f.id));

  const accepted: { key: string; pesagemId: string }[] = [];
  const duplicated: { key: string }[] = [];
  const failed: { key: string; motivo: string }[] = [];

  for (const item of items) {
    try {
      if (!permitidas.has(item.fazendaId)) {
        failed.push({ key: item.key, motivo: 'Fazenda não pertence ao usuário' });
        continue;
      }
      if (!item.animalBrinco || !item.pesoKg || item.pesoKg <= 0) {
        failed.push({ key: item.key, motivo: 'Dados inválidos' });
        continue;
      }

      const animal = await prisma.animal.findFirst({
        where: { fazendaId: item.fazendaId, brinco: item.animalBrinco },
        select: { id: true, pesoAtualKg: true },
      });
      if (!animal) {
        failed.push({ key: item.key, motivo: `Animal ${item.animalBrinco} não encontrado` });
        continue;
      }

      const existente = await prisma.pesagem.findFirst({
        where: {
          animalId: animal.id,
          observacao: `offline:${item.key}`,
        },
        select: { id: true },
      });
      if (existente) {
        duplicated.push({ key: item.key });
        continue;
      }

      const data = item.criadoEm ? new Date(item.criadoEm) : new Date();
      const gmd = animal.pesoAtualKg
        ? Number(((item.pesoKg - animal.pesoAtualKg) / 30).toFixed(3))
        : null;

      const pesagem = await prisma.pesagem.create({
        data: {
          animalId: animal.id,
          pesoKg: item.pesoKg,
          data,
          gmd,
          origem: 'offline',
          observacao: `offline:${item.key}`,
          usuarioId: session.user.id,
        },
      });

      await prisma.animal.update({
        where: { id: animal.id },
        data: { pesoAtualKg: item.pesoKg, gmdAtual: gmd ?? undefined },
      });

      await prisma.logAuditoria.create({
        data: {
          userId: session.user.id,
          fazendaId: item.fazendaId,
          acao: 'sync_offline',
          entidade: 'Pesagem',
          entidadeId: pesagem.id,
          dadosDepois: { pesoKg: item.pesoKg, brinco: item.animalBrinco },
        },
      });

      accepted.push({ key: item.key, pesagemId: pesagem.id });
    } catch (e: any) {
      failed.push({ key: item.key, motivo: e?.message ?? 'Erro desconhecido' });
    }
  }

  return NextResponse.json({ accepted, duplicated, failed });
}
