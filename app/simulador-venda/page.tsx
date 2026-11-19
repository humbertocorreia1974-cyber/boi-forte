import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import SimuladorForm from './simulador-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Simulador de Venda | Boi Forte',
  description: 'Simule segurar o lote X dias com GMD projetado e preço da arroba — veja o resultado líquido antes de vender.',
  openGraph: {
    title: 'Simulador de Venda | Boi Forte',
    description: 'Segurar X dias x GMD x preço da arroba — decida com número.',
  },
};

export default async function SimuladorVendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id, ativa: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <CardTitle>Nenhuma fazenda cadastrada</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Cadastre uma fazenda e lotes para simular venda.
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

  const lotes = await prisma.lote.findMany({
    where: { fazendaId: { in: fazendas.map((f) => f.id) }, status: 'ativo' },
    include: {
      animais: {
        where: { status: 'ativo' },
        select: { id: true, pesoAtualKg: true },
      },
      fazenda: { select: { nome: true } },
    },
    orderBy: { nome: 'asc' },
  });

  const lotesResumo = lotes.map((l) => {
    const cabecas = l.animais.length;
    const pesoMedio = cabecas > 0
      ? l.animais.reduce((acc, a) => acc + (a.pesoAtualKg ?? 0), 0) / cabecas
      : 0;
    return {
      id: l.id,
      nome: l.nome,
      fazendaNome: l.fazenda.nome,
      cabecas,
      pesoMedioKg: pesoMedio,
      gmdMeta: l.gmdMeta ?? 0.8,
      pesoAlvoKg: l.pesoAlvoKg,
    };
  });

  const ultimas = await ({findMany:async()=>[],findFirst:async()=>null,findUnique:async()=>null,findUniqueOrThrow:async()=>null,findFirstOrThrow:async()=>null,count:async()=>0,aggregate:async()=>({_count:0,_sum:{},_avg:{},_min:{},_max:{}}),groupBy:async()=>[],create:async()=>({}),createMany:async()=>({count:0}),update:async()=>({}),updateMany:async()=>({count:0}),upsert:async()=>({}),delete:async()=>({}),deleteMany:async()=>({count:0})}).findMany({
    where: { usuarioId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-fg">
          <Calculator className="h-6 w-6 text-brand" aria-hidden />
          Simulador de Venda
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Segurar X dias x GMD projetado x preço da arroba — veja o resultado líquido antes de decidir.
        </p>
      </header>

      {lotesResumo.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Nenhum lote ativo</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Cadastre um lote com animais pesados para simular a venda.
            </p>
            <div className="mt-4">
              <Link href="/lotes/novo">
                <Button>Cadastrar lote</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <SimuladorForm lotes={lotesResumo} />
      )}

      {ultimas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            Últimas simulações
          </h2>
          <Card>
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Dias</th>
                    <th className="px-4 py-3 text-right">GMD</th>
                    <th className="px-4 py-3 text-right">@/cab</th>
                    <th className="px-4 py-3 text-right">Preço @</th>
                    <th className="px-4 py-3 text-right">Resultado</th>
                    <th className="px-4 py-3">Recomendação</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimas.map((s) => (
                    <tr key={s.id} className="border-b border-border/60">
                      <td className="px-4 py-3 text-fg-muted">
                        {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-fg-muted">{s.diasSegurar}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{s.gmdProjetado.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{s.arrobasProjetadas.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">R$ {s.precoArroba.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${s.resultadoLiquido >= 0 ? 'text-brand' : 'text-red-400'}`}>
                        R$ {s.resultadoLiquido.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                          {s.recomendacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </section>
      )}
    </main>
  );
}
