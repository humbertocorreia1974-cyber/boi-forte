import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Beef } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'GMD por animal e por lote | Boi Forte',
  description: 'Ganho médio diário calculado automaticamente a partir das pesagens reais de cada animal e consolidado por lote.',
  openGraph: {
    title: 'GMD por animal e por lote | Boi Forte',
    description: 'GMD automático a partir das pesagens reais — por animal e por lote.',
  },
};

function calcGmd(pesagens: { pesoKg: number; data: Date }[]): number | null {
  if (pesagens.length < 2) return null;
  const sorted = [...pesagens].sort((a, b) => a.data.getTime() - b.data.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const dias = (last.data.getTime() - first.data.getTime()) / 86400000;
  if (dias <= 0) return null;
  return (last.pesoKg - first.pesoKg) / dias;
}

export default async function Page({ searchParams }: { searchParams: { fazenda?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-fg">GMD por animal e por lote</h1>
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">Você ainda não cadastrou nenhuma fazenda.</p>
            <Link href="/fazendas" className="mt-4 inline-block">
              <Button variant="primary">Cadastrar fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaId = searchParams.fazenda ?? fazendas[0].id;
  const fazendaAtual = fazendas.find((f) => f.id === fazendaId) ?? fazendas[0];

  const animais = await prisma.animal.findMany({
    where: { fazendaId: fazendaAtual.id, status: 'ativo' },
    include: {
      pesagens: { orderBy: { data: 'asc' } },
      lote: true,
    },
  });

  const porAnimal = animais
    .map((a) => ({
      id: a.id,
      brinco: a.brinco,
      nome: a.nome,
      lote: a.lote?.nome ?? '—',
      pesoAtual: a.pesoAtualKg ?? a.pesagens[a.pesagens.length - 1]?.pesoKg ?? null,
      gmd: calcGmd(a.pesagens),
      pesagens: a.pesagens.length,
    }))
    .filter((a) => a.gmd !== null)
    .sort((a, b) => (b.gmd ?? 0) - (a.gmd ?? 0));

  const lotesMap = new Map<string, { nome: string; gmdSoma: number; n: number; animais: number }>();
  for (const a of porAnimal) {
    const key = a.lote;
    const cur = lotesMap.get(key) ?? { nome: key, gmdSoma: 0, n: 0, animais: 0 };
    cur.gmdSoma += a.gmd ?? 0;
    cur.n += 1;
    cur.animais += 1;
    lotesMap.set(key, cur);
  }
  const porLote = Array.from(lotesMap.values())
    .map((l) => ({ nome: l.nome, gmd: l.n > 0 ? l.gmdSoma / l.n : 0, animais: l.animais }))
    .sort((a, b) => b.gmd - a.gmd);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">GMD por animal e por lote</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Ganho médio diário calculado a partir das pesagens reais — {fazendaAtual.nome}
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-xs text-fg-muted">Fazenda</label>
          <select
            name="fazenda"
            defaultValue={fazendaAtual.id}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        </form>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              <CardTitle>GMD médio por lote</CardTitle>
            </div>
            {porLote.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">
                Nenhum lote com pesagens suficientes. Registre ao menos 2 pesagens por animal.
              </p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="pb-2">Lote</th>
                    <th className="pb-2">Animais</th>
                    <th className="pb-2 text-right">GMD (kg/dia)</th>
                  </tr>
                </thead>
                <tbody>
                  {porLote.map((l) => (
                    <tr key={l.nome} className="border-t border-border">
                      <td className="py-2 text-fg">{l.nome}</td>
                      <td className="py-2 text-fg-muted">{l.animais}</td>
                      <td className="py-2 text-right font-medium text-brand">{l.gmd.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Beef className="h-5 w-5 text-brand" />
              <CardTitle>Top 20 animais por GMD</CardTitle>
            </div>
            {porAnimal.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">
                Sem dados de GMD. Cadastre pesagens em <Link href="/animais" className="text-brand underline">Animais</Link>.
              </p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="pb-2">#</th>
                    <th className="pb-2">Brinco</th>
                    <th className="pb-2">Lote</th>
                    <th className="pb-2 text-right">Peso</th>
                    <th className="pb-2 text-right">GMD</th>
                  </tr>
                </thead>
                <tbody>
                  {porAnimal.slice(0, 20).map((a, i) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2 text-fg-muted">{i + 1}</td>
                      <td className="py-2">
                        <Link href={`/animais/${a.id}/curva-crescimento`} className="text-brand hover:underline">
                          {a.brinco}
                        </Link>
                      </td>
                      <td className="py-2 text-fg-muted">{a.lote}</td>
                      <td className="py-2 text-right text-fg-muted">{a.pesoAtual ? `${a.pesoAtual.toFixed(0)} kg` : '—'}</td>
                      <td className="py-2 text-right font-medium text-brand">{a.gmd?.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
