import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projeção de abate | Boi Forte',
  description: 'Data projetada de abate por animal, calculada com peso-alvo e GMD real — ordenada por urgência.',
  openGraph: {
    title: 'Projeção de abate | Boi Forte',
    description: 'Saiba quando cada animal atinge o peso-alvo com base no GMD real.',
  },
};

function calcGmd(pesagens: { pesoKg: number; data: Date }[]): number | null {
  if (pesagens.length < 2) return null;
  const sorted = [...pesagens].sort((a, b) => a.data.getTime() - b.data.getTime());
  const dias = (sorted[sorted.length - 1].data.getTime() - sorted[0].data.getTime()) / 86400000;
  if (dias <= 0) return null;
  return (sorted[sorted.length - 1].pesoKg - sorted[0].pesoKg) / dias;
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
        <h1 className="text-2xl font-semibold text-fg">Projeção de abate</h1>
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">Cadastre uma fazenda para começar.</p>
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
    include: { pesagens: { orderBy: { data: 'asc' } }, lote: true },
  });

  const hoje = new Date();
  const projecoes = animais
    .map((a) => {
      const gmd = calcGmd(a.pesagens);
      const pesoAtual = a.pesoAtualKg ?? a.pesagens[a.pesagens.length - 1]?.pesoKg ?? null;
      const pesoAlvo = a.pesoAlvoKg ?? a.lote?.pesoAlvoKg ?? null;
      if (!gmd || gmd <= 0 || pesoAtual == null || pesoAlvo == null) return null;
      const kgFaltando = pesoAlvo - pesoAtual;
      if (kgFaltando <= 0) {
        return {
          id: a.id,
          brinco: a.brinco,
          lote: a.lote?.nome ?? '—',
          pesoAtual,
          pesoAlvo,
          gmd,
          diasRestantes: 0,
          dataProjetada: hoje,
          pronto: true,
        };
      }
      const diasRestantes = Math.ceil(kgFaltando / gmd);
      const dataProjetada = new Date(hoje.getTime() + diasRestantes * 86400000);
      return {
        id: a.id,
        brinco: a.brinco,
        lote: a.lote?.nome ?? '—',
        pesoAtual,
        pesoAlvo,
        gmd,
        diasRestantes,
        dataProjetada,
        pronto: false,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const prontos = projecoes.filter((p) => p.pronto).length;
  const proximos30 = projecoes.filter((p) => !p.pronto && p.diasRestantes <= 30).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Projeção de abate</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Peso-alvo ÷ GMD real — {fazendaAtual.nome}
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

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase text-fg-muted">Prontos para abate</p>
            <p className="mt-1 text-2xl font-semibold text-brand">{prontos}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase text-fg-muted">Nos próximos 30 dias</p>
            <p className="mt-1 text-2xl font-semibold text-fg">{proximos30}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase text-fg-muted">Total projetado</p>
            <p className="mt-1 text-2xl font-semibold text-fg">{projecoes.length}</p>
          </CardBody>
        </Card>
      </section>

      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand" />
            <CardTitle>Animais ordenados por urgência</CardTitle>
          </div>
          {projecoes.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">
              Nenhuma projeção disponível. É necessário ter peso-alvo definido e ao menos 2 pesagens por animal.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="pb-2">Brinco</th>
                    <th className="pb-2">Lote</th>
                    <th className="pb-2 text-right">Peso atual</th>
                    <th className="pb-2 text-right">Alvo</th>
                    <th className="pb-2 text-right">GMD</th>
                    <th className="pb-2 text-right">Dias</th>
                    <th className="pb-2 text-right">Data projetada</th>
                  </tr>
                </thead>
                <tbody>
                  {projecoes.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-2">
                        <Link href={`/animais/${p.id}/curva-crescimento`} className="text-brand hover:underline">
                          {p.brinco}
                        </Link>
                      </td>
                      <td className="py-2 text-fg-muted">{p.lote}</td>
                      <td className="py-2 text-right text-fg-muted">{p.pesoAtual.toFixed(0)} kg</td>
                      <td className="py-2 text-right text-fg-muted">{p.pesoAlvo.toFixed(0)} kg</td>
                      <td className="py-2 text-right text-fg-muted">{p.gmd.toFixed(3)}</td>
                      <td className="py-2 text-right font-medium text-fg">{p.diasRestantes}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            p.pronto
                              ? 'rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand'
                              : 'rounded-full bg-surface px-2 py-0.5 text-xs text-fg-muted border border-border'
                          }
                        >
                          {p.pronto ? 'Pronto' : p.dataProjetada.toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
