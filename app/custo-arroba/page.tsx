import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Custo por arroba produzida | Boi Forte',
  description:
    'Custo por arroba produzida com rateio automático por lote — rateio proporcional por UA-dia, custo fixo e variável, e ranking de eficiência por lote.',
  openGraph: {
    title: 'Custo por arroba produzida | Boi Forte',
    description:
      'Rateio automático de custos por lote e custo por arroba produzida em tempo real.',
    type: 'website',
  },
};

type SearchParams = { fazendaId?: string; loteId?: string };

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true, uaPadraoKg: true },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-fg">Custo por arroba produzida</h1>
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">
              Você ainda não cadastrou nenhuma fazenda. Cadastre uma fazenda para começar a
              acompanhar o custo por arroba.
            </p>
            <Link href="/fazendas" className="mt-4 inline-block">
              <Button>Cadastrar fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaId = searchParams.fazendaId ?? fazendas[0].id;
  const fazenda = fazendas.find((f) => f.id === fazendaId) ?? fazendas[0];
  const uaPadrao = fazenda.uaPadraoKg || 450;

  const lotes = await prisma.lote.findMany({
    where: { fazendaId: fazenda.id, status: 'ativo' },
    include: {
      animais: { select: { id: true, pesoAtualKg: true, status: true } },
      custos: { select: { id: true, valor: true, categoria: true, data: true } },
    },
    orderBy: { nome: 'asc' },
  });

  const custosSemLote = await prisma.custo.findMany({
    where: { fazendaId: fazenda.id, loteId: null },
    select: { id: true, valor: true, categoria: true },
  });

  // UA-dia por lote (proxy: UA média do lote * dias desde dataEntrada)
  const now = Date.now();
  const lotesCalc = lotes.map((l) => {
    const ativos = l.animais.filter((a) => a.status === 'ativo');
    const pesoMedio =
      ativos.length > 0
        ? ativos.reduce((s, a) => s + (a.pesoAtualKg ?? 0), 0) / ativos.length
        : 0;
    const uaMedia = pesoMedio > 0 ? pesoMedio / uaPadrao : 0;
    const dias = l.dataEntrada
      ? Math.max(1, Math.floor((now - new Date(l.dataEntrada).getTime()) / 86400000))
      : 1;
    const uaDia = uaMedia * dias;
    const custoDireto = l.custos.reduce((s, c) => s + c.valor, 0);
    return {
      id: l.id,
      nome: l.nome,
      tipo: l.tipo,
      cabecas: ativos.length,
      pesoMedio,
      uaMedia,
      dias,
      uaDia,
      custoDireto,
      pesoAlvoKg: l.pesoAlvoKg,
    };
  });

  const totalUaDia = lotesCalc.reduce((s, l) => s + l.uaDia, 0);
  const totalCustosComuns = custosSemLote.reduce((s, c) => s + c.valor, 0);

  const linhas = lotesCalc.map((l) => {
    const rateio = totalUaDia > 0 ? (l.uaDia / totalUaDia) * totalCustosComuns : 0;
    const custoTotal = l.custoDireto + rateio;
    // arrobas produzidas = (pesoAtual - pesoEntrada estimado 30% do alvo) * cabeças / 30
    const pesoEntrada = l.pesoAlvoKg * 0.4;
    const arrobasProduzidas = Math.max(
      0,
      ((l.pesoMedio - pesoEntrada) * l.cabecas) / 30,
    );
    const custoArroba = arrobasProduzidas > 0 ? custoTotal / arrobasProduzidas : 0;
    return { ...l, rateio, custoTotal, arrobasProduzidas, custoArroba };
  });

  const ordenado = [...linhas].sort((a, b) => {
    if (a.custoArroba === 0) return 1;
    if (b.custoArroba === 0) return -1;
    return a.custoArroba - b.custoArroba;
  });

  const custoMedioFazenda =
    ordenado.filter((l) => l.custoArroba > 0).reduce((s, l) => s + l.custoArroba, 0) /
    Math.max(1, ordenado.filter((l) => l.custoArroba > 0).length);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Custo por arroba produzida</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Rateio automático por UA-dia. Custo médio da fazenda:{' '}
            <span className="font-medium text-brand">{fmtBRL(custoMedioFazenda)}/@</span>
          </p>
        </div>
        <form className="flex items-end gap-2" action="/custo-arroba">
          <label className="flex flex-col text-xs text-fg-muted">
            Fazenda
            <select
              name="fazendaId"
              defaultValue={fazenda.id}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              {fazendas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary" size="sm">
            Aplicar
          </Button>
        </form>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Custos comuns</p>
            <p className="mt-1 text-xl font-semibold text-fg">{fmtBRL(totalCustosComuns)}</p>
            <p className="mt-1 text-xs text-fg-muted">Rateados por UA-dia</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">UA-dia total</p>
            <p className="mt-1 text-xl font-semibold text-fg">{totalUaDia.toFixed(1)}</p>
            <p className="mt-1 text-xs text-fg-muted">Somatório dos lotes ativos</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Lotes ativos</p>
            <p className="mt-1 text-xl font-semibold text-fg">{lotes.length}</p>
            <p className="mt-1 text-xs text-fg-muted">Em recria/engorda</p>
          </CardBody>
        </Card>
      </section>

      <Card className="mt-6">
        <CardTitle>Rateio por lote</CardTitle>
        <CardBody>
          {ordenado.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-fg-muted">
                Nenhum lote ativo nesta fazenda ainda. Crie um lote para começar a ratear custos.
              </p>
              <Link href="/fazendas" className="mt-4 inline-block">
                <Button size="sm">Ir para fazendas</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Lote</th>
                    <th className="py-2 pr-3 text-right">Cabeças</th>
                    <th className="py-2 pr-3 text-right">Peso médio</th>
                    <th className="py-2 pr-3 text-right">UA-dia</th>
                    <th className="py-2 pr-3 text-right">Custo direto</th>
                    <th className="py-2 pr-3 text-right">Rateio</th>
                    <th className="py-2 pr-3 text-right">@ produzidas</th>
                    <th className="py-2 pr-3 text-right">Custo/@</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenado.map((l, i) => (
                    <tr key={l.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-fg-muted">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <Link
                          href={`/lotes/${l.id}`}
                          className="font-medium text-fg hover:text-brand"
                        >
                          {l.nome}
                        </Link>
                        <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                          {l.tipo}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right text-fg">{l.cabecas}</td>
                      <td className="py-2 pr-3 text-right text-fg">
                        {l.pesoMedio.toFixed(0)} kg
                      </td>
                      <td className="py-2 pr-3 text-right text-fg">{l.uaDia.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right text-fg">{fmtBRL(l.custoDireto)}</td>
                      <td className="py-2 pr-3 text-right text-fg-muted">{fmtBRL(l.rateio)}</td>
                      <td className="py-2 pr-3 text-right text-fg">
                        {l.arrobasProduzidas.toFixed(1)}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-brand">
                        {l.custoArroba > 0 ? fmtBRL(l.custoArroba) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardTitle>Lançar custo</CardTitle>
        <CardBody>
          <form
            action="/api/custos"
            method="POST"
            className="grid gap-3 sm:grid-cols-4"
          >
            <input type="hidden" name="fazendaId" value={fazenda.id} />
            <label className="flex flex-col text-xs text-fg-muted">
              Categoria
              <select
                name="categoria"
                required
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="nutricao">Nutrição</option>
                <option value="sanidade">Sanidade</option>
                <option value="mao-de-obra">Mão de obra</option>
                <option value="combustivel">Combustível</option>
                <option value="arrendamento">Arrendamento</option>
                <option value="outros">Outros</option>
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Lote (opcional)
              <select
                name="loteId"
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">— Custo comum (rateio) —</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Valor (R$)
              <Input name="valor" type="number" step="0.01" min="0" required />
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Descrição
              <Input name="descricao" placeholder="Ex: sal mineral" />
            </label>
            <div className="sm:col-span-4">
              <Button type="submit" size="sm">
                Lançar custo
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
