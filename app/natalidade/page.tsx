import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Taxa de Natalidade por Safra | Boi Forte',
  description: 'Acompanhe a taxa de natalidade do rebanho por safra, com histórico de partos e matrizes ativas.',
  openGraph: {
    title: 'Taxa de Natalidade por Safra | Boi Forte',
    description: 'Acompanhe a taxa de natalidade do rebanho por safra.',
    type: 'website',
  },
};

type SafraAgg = {
  safra: string;
  partos: number;
  bezerros: number;
};

export default async function NatalidadePage({
  searchParams,
}: {
  searchParams: Promise<{ fazendaId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const sp = await searchParams;
  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-fg">Taxa de Natalidade</h1>
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">Você ainda não cadastrou nenhuma fazenda.</p>
            <Link href="/fazendas" className="mt-4 inline-block">
              <Button variant="primary" size="md">Cadastrar primeira fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaId = sp.fazendaId && fazendas.some((f) => f.id === sp.fazendaId)
    ? sp.fazendaId
    : fazendas[0].id;

  const fazendaAtual = fazendas.find((f) => f.id === fazendaId)!;

  const partos = await prisma.parto.findMany({
    where: { mae: { fazendaId } },
    select: {
      id: true,
      safra: true,
      dataParto: true,
      bezerroId: true,
      pesoNascimentoKg: true,
    },
    orderBy: { dataParto: 'desc' },
  });

  const matrizesAtivas = await prisma.animal.count({
    where: { fazendaId, sexo: 'F', status: 'ativo', categoria: { in: ['matriz', 'vaca'] } },
  });

  const porSafra = new Map<string, SafraAgg>();
  for (const p of partos) {
    const safra = p.safra ?? String(new Date(p.dataParto).getFullYear());
    const cur = porSafra.get(safra) ?? { safra, partos: 0, bezerros: 0 };
    cur.partos += 1;
    if (p.bezerroId) cur.bezerros += 1;
    porSafra.set(safra, cur);
  }

  const safras = Array.from(porSafra.values()).sort((a, b) => b.safra.localeCompare(a.safra));
  const maxPartos = Math.max(1, ...safras.map((s) => s.partos));

  const totalPartos = safras.reduce((acc, s) => acc + s.partos, 0);
  const taxaGeral = matrizesAtivas > 0 ? (totalPartos / matrizesAtivas) * 100 : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Taxa de Natalidade por Safra</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {fazendaAtual.nome} · {matrizesAtivas} matrizes ativas · {totalPartos} partos registrados
          </p>
        </div>
        <form className="flex items-end gap-2" action="/natalidade">
          <label className="flex flex-col text-xs text-fg-muted">
            Fazenda
            <select
              name="fazendaId"
              defaultValue={fazendaId}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              {fazendas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </label>
          <Button variant="secondary" size="sm" type="submit">Filtrar</Button>
        </form>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Taxa geral</p>
            <p className="mt-2 text-3xl font-semibold text-brand">
              {taxaGeral.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-fg-muted">partos / matrizes ativas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Safras registradas</p>
            <p className="mt-2 text-3xl font-semibold text-fg">{safras.length}</p>
            <p className="mt-1 text-xs text-fg-muted">histórico completo</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Bezerros nascidos</p>
            <p className="mt-2 text-3xl font-semibold text-fg">
              {safras.reduce((a, s) => a + s.bezerros, 0)}
            </p>
            <p className="mt-1 text-xs text-fg-muted">com bezerro vinculado</p>
          </CardBody>
        </Card>
      </section>

      <Card className="mt-8">
        <CardTitle>Partos por safra</CardTitle>
        <CardBody>
          {safras.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-fg-muted">Nenhum parto registrado ainda.</p>
              <Link href="/reproducao" className="mt-4 inline-block">
                <Button variant="primary" size="sm">Registrar primeiro parto</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {safras.map((s) => {
                const taxa = matrizesAtivas > 0 ? (s.partos / matrizesAtivas) * 100 : 0;
                const pct = (s.partos / maxPartos) * 100;
                return (
                  <li key={s.safra}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-fg">Safra {s.safra}</span>
                      <span className="text-fg-muted">
                        {s.partos} partos · {taxa.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mt-8">
        <CardTitle>Detalhamento</CardTitle>
        <CardBody>
          {safras.length === 0 ? (
            <p className="text-sm text-fg-muted">Sem dados para exibir.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="px-3 py-2">Safra</th>
                    <th className="px-3 py-2 text-right">Partos</th>
                    <th className="px-3 py-2 text-right">Bezerros</th>
                    <th className="px-3 py-2 text-right">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {safras.map((s) => {
                    const taxa = matrizesAtivas > 0 ? (s.partos / matrizesAtivas) * 100 : 0;
                    return (
                      <tr key={s.safra} className="border-b border-border/50">
                        <td className="px-3 py-2 text-fg">{s.safra}</td>
                        <td className="px-3 py-2 text-right text-fg">{s.partos}</td>
                        <td className="px-3 py-2 text-right text-fg">{s.bezerros}</td>
                        <td className="px-3 py-2 text-right font-medium text-brand">
                          {taxa.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
