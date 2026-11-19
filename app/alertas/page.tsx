import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AlertTriangle, Syringe, Package, Bell } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertaAcaoClient } from './alerta-acao-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alertas | Boi Forte',
  description: 'Estoque mínimo e sanidade vencendo — notificações em tempo real por fazenda.',
  openGraph: {
    title: 'Alertas | Boi Forte',
    description: 'Estoque mínimo e sanidade vencendo no seu rebanho.',
  },
};

export default async function AlertasPage({
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
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Card>
          <CardBody>
            <CardTitle>Nenhuma fazenda cadastrada</CardTitle>
            <p className="mt-2 text-fg-muted">
              Cadastre uma fazenda para começar a receber alertas de estoque e sanidade.
            </p>
            <Link href="/fazendas/nova" className="mt-4 inline-block">
              <Button>Criar fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaIds = sp.fazendaId
    ? fazendas.filter((f) => f.id === sp.fazendaId).map((f) => f.id)
    : fazendas.map((f) => f.id);

  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + 30);

  const [insumos, aplicacoes] = await Promise.all([
    prisma.insumo.findMany({
      where: { fazendaId: { in: fazendaIds } },
      include: { fazenda: { select: { nome: true } } },
      orderBy: { quantidadeAtual: 'asc' },
    }),
    prisma.aplicacaoSanitaria.findMany({
      where: {
        animal: { fazendaId: { in: fazendaIds } },
        dataVencimento: { lte: limite },
      },
      include: {
        animal: { select: { brinco: true, fazenda: { select: { nome: true } } } },
        protocolo: { select: { nome: true } },
      },
      orderBy: { dataVencimento: 'asc' },
      take: 100,
    }),
  ]);

  const estoqueCritico = insumos.filter((i) => i.quantidadeAtual <= i.estoqueMinimo);
  const total = estoqueCritico.length + aplicacoes.length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-fg">Central de alertas</h1>
          <p className="mt-1 text-fg-muted">
            {total === 0
              ? 'Nenhum alerta ativo. Tudo em ordem no curral.'
              : `${total} alerta${total > 1 ? 's' : ''} exigindo sua atenção.`}
          </p>
        </div>
        <AlertaAcaoClient fazendas={fazendas} />
      </header>

      <form className="mb-6 flex flex-wrap items-end gap-3" action="/alertas">
        <label className="flex flex-col gap-1 text-sm text-fg-muted">
          Fazenda
          <select
            name="fazendaId"
            defaultValue={sp.fazendaId ?? ''}
            className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
          >
            <option value="">Todas</option>
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Filtrar
        </Button>
      </form>

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-fg">
          <Package className="h-5 w-5 text-brand" aria-hidden /> Estoque mínimo
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
            {estoqueCritico.length}
          </span>
        </h2>
        {estoqueCritico.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-fg-muted">Nenhum insumo abaixo do mínimo. Bom trabalho.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-bg/40 text-left text-fg-muted">
                <tr>
                  <th className="px-4 py-2">Insumo</th>
                  <th className="px-4 py-2">Fazenda</th>
                  <th className="px-4 py-2 text-right">Atual</th>
                  <th className="px-4 py-2 text-right">Mínimo</th>
                  <th className="px-4 py-2">Unidade</th>
                </tr>
              </thead>
              <tbody>
                {estoqueCritico.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-4 py-2 text-fg">{i.nome}</td>
                    <td className="px-4 py-2 text-fg-muted">{i.fazenda.nome}</td>
                    <td className="px-4 py-2 text-right font-medium text-red-500">
                      {i.quantidadeAtual}
                    </td>
                    <td className="px-4 py-2 text-right text-fg-muted">{i.estoqueMinimo}</td>
                    <td className="px-4 py-2 text-fg-muted">{i.unidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-fg">
          <Syringe className="h-5 w-5 text-brand" aria-hidden /> Sanidade vencendo (30 dias)
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
            {aplicacoes.length}
          </span>
        </h2>
        {aplicacoes.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-fg-muted">Nenhuma aplicação com vencimento próximo.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-bg/40 text-left text-fg-muted">
                <tr>
                  <th className="px-4 py-2">Animal</th>
                  <th className="px-4 py-2">Protocolo</th>
                  <th className="px-4 py-2">Fazenda</th>
                  <th className="px-4 py-2">Vence em</th>
                </tr>
              </thead>
              <tbody>
                {aplicacoes.map((a) => {
                  const venc = a.dataVencimento ? new Date(a.dataVencimento) : null;
                  const dias = venc
                    ? Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
                    : null;
                  const atrasado = dias !== null && dias < 0;
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-2 text-fg">#{a.animal.brinco}</td>
                      <td className="px-4 py-2 text-fg-muted">{a.protocolo.nome}</td>
                      <td className="px-4 py-2 text-fg-muted">{a.animal.fazenda.nome}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            atrasado
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {atrasado ? <AlertTriangle className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                          {venc ? venc.toLocaleDateString('pt-BR') : '—'}
                          {dias !== null && ` (${dias}d)`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
