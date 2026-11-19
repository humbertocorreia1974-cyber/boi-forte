import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MapPin, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ranking de Piquetes por UA/ha | Boi Forte',
  description: 'Ranking de piquetes por Unidade Animal por hectare — identifique os pastos mais produtivos da fazenda.',
  openGraph: {
    title: 'Ranking de Piquetes por UA/ha | Boi Forte',
    description: 'Ranking de piquetes por UA/ha em tempo real.',
  },
};

type RankingItem = {
  piqueteId: string;
  nome: string;
  areaHa: number;
  tipoPasto: string | null;
  status: string;
  uaTotal: number;
  uaPorHa: number;
  cabecas: number;
};

export default async function RankingPiquetesPage({
  searchParams,
}: {
  searchParams: Promise<{ fazendaId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const sp = await searchParams;

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id, ativa: true },
    select: { id: true, nome: true, uaPadraoKg: true },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Card>
          <CardBody>
            <CardTitle>Nenhuma fazenda cadastrada</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Cadastre uma fazenda e seus piquetes para ver o ranking de UA/ha.
            </p>
            <div className="mt-4">
              <Link href="/fazendas/nova">
                <Button>Cadastrar fazenda</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaId = sp.fazendaId && fazendas.some((f) => f.id === sp.fazendaId)
    ? sp.fazendaId
    : fazendas[0].id;
  const fazendaAtual = fazendas.find((f) => f.id === fazendaId)!;

  const piquetes = await prisma.piquete.findMany({
    where: { fazendaId },
    include: {
      lotes: {
        where: { status: 'ativo' },
        include: {
          animais: {
            where: { status: 'ativo' },
            select: { id: true, pesoAtualKg: true },
          },
        },
      },
    },
  });

  const ranking: RankingItem[] = piquetes
    .map((p) => {
      const animais = p.lotes.flatMap((l) => l.animais);
      const uaTotal = animais.reduce(
        (acc, a) => acc + (a.pesoAtualKg ?? 0) / fazendaAtual.uaPadraoKg,
        0,
      );
      const uaPorHa = p.areaHa > 0 ? uaTotal / p.areaHa : 0;
      return {
        piqueteId: p.id,
        nome: p.nome,
        areaHa: p.areaHa,
        tipoPasto: p.tipoPasto,
        status: p.status,
        uaTotal,
        uaPorHa,
        cabecas: animais.length,
      };
    })
    .sort((a, b) => b.uaPorHa - a.uaPorHa);

  const totalUa = ranking.reduce((acc, r) => acc + r.uaTotal, 0);
  const totalHa = ranking.reduce((acc, r) => acc + r.areaHa, 0);
  const mediaUaHa = totalHa > 0 ? totalUa / totalHa : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-fg">
            <Trophy className="h-6 w-6 text-brand" aria-hidden />
            Ranking de Piquetes por UA/ha
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {fazendaAtual.nome} · {totalUa.toFixed(1)} UA em {totalHa.toFixed(1)} ha · média {mediaUaHa.toFixed(2)} UA/ha
          </p>
        </div>
        <form className="flex items-center gap-2" action="/ranking-piquetes">
          <label htmlFor="fazendaId" className="text-sm text-fg-muted">Fazenda</label>
          <select
            id="fazendaId"
            name="fazendaId"
            defaultValue={fazendaId}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">Aplicar</Button>
        </form>
      </header>

      {ranking.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Sem piquetes cadastrados</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Cadastre piquetes com área e lotes ativos para calcular UA/ha.
            </p>
            <div className="mt-4">
              <Link href={`/fazendas/${fazendaId}/piquetes/novo`}>
                <Button>Cadastrar piquete</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Piquete</th>
                  <th className="px-4 py-3">Pasto</th>
                  <th className="px-4 py-3 text-right">Área (ha)</th>
                  <th className="px-4 py-3 text-right">Cabeças</th>
                  <th className="px-4 py-3 text-right">UA</th>
                  <th className="px-4 py-3 text-right">UA/ha</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.piqueteId} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold text-brand">#{i + 1}</td>
                    <td className="px-4 py-3 text-fg">
                      <Link href={`/piquetes/${r.piqueteId}`} className="hover:text-brand">
                        {r.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{r.tipoPasto ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-fg-muted">{r.areaHa.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-fg-muted">{r.cabecas}</td>
                    <td className="px-4 py-3 text-right text-fg-muted">{r.uaTotal.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-medium text-fg">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-brand" aria-hidden />
                        {r.uaPorHa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
