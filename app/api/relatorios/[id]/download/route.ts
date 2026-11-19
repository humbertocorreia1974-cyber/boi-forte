import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('unauthorized', { status: 401 });

  const { id } = await params;
  const rel = await prisma.relatorio.findFirst({
    where: { id, usuarioId: session.user.id },
    include: { fazenda: { select: { nome: true } } },
  });
  if (!rel) return new Response('not found', { status: 404 });

  const linhas: string[][] = [['Relatório', rel.tipo], ['Fazenda', rel.fazenda.nome], ['Formato', rel.formato], ['Gerado em', new Date(rel.createdAt).toLocaleString('pt-BR')]];

  if (rel.tipo === 'animais') {
    const animais = await prisma.animal.findMany({
      where: { fazendaId: rel.fazendaId },
      select: { brinco: true, raca: true, categoria: true, pesoAtualKg: true, gmdAtual: true, status: true },
      take: 500,
    });
    linhas.push([]);
    linhas.push(['Brinco', 'Raça', 'Categoria', 'Peso (kg)', 'GMD', 'Status']);
    for (const a of animais) {
      linhas.push([a.brinco, a.raca ?? '', a.categoria, String(a.pesoAtualKg ?? ''), String(a.gmdAtual ?? ''), a.status]);
    }
  } else if (rel.tipo === 'custos') {
    const custos = await prisma.custo.findMany({
      where: { fazendaId: rel.fazendaId },
      select: { categoria: true, descricao: true, valor: true, data: true },
      take: 500,
    });
    linhas.push([]);
    linhas.push(['Categoria', 'Descrição', 'Valor', 'Data']);
    for (const c of custos) {
      linhas.push([c.categoria, c.descricao ?? '', String(c.valor), new Date(c.data).toLocaleDateString('pt-BR')]);
    }
  } else {
    const pesagens = await prisma.pesagem.findMany({
      where: { animal: { fazendaId: rel.fazendaId } },
      select: { pesoKg: true, data: true, animal: { select: { brinco: true } } },
      take: 500,
      orderBy: { data: 'desc' },
    });
    linhas.push([]);
    linhas.push(['Brinco', 'Peso (kg)', 'Data']);
    for (const p of pesagens) {
      linhas.push([p.animal.brinco, String(p.pesoKg), new Date(p.data).toLocaleDateString('pt-BR')]);
    }
  }

  const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const filename = `boi-forte-${rel.tipo}-${rel.id.slice(0, 8)}.${rel.formato === 'excel' ? 'csv' : 'txt'}`;

  return new Response(csv, {
    headers: {
      'Content-Type': rel.formato === 'excel' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
