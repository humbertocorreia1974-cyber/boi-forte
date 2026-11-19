import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotacaoActions } from './rotacao-actions-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rotação de pasto | Boi Forte',
  description: 'Histórico de rotação, tempo de descanso e ocupação por piquete.',
  openGraph: {
    title: 'Rotação de pasto | Boi Forte',
    description: 'Histórico de rotação, tempo de descanso e ocupação por piquete.',
  },
};

function diasEntre(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

export default async function RotacaoPage({
  searchParams,
}: {
  searchParams: { fazenda?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id, ativa: true },
    orderBy: { nome: 'asc' },
  });

  if (fazendas.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-fg">Rotação de pasto</h1>
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">Você ainda não tem fazendas cadastradas.</p>
            <Link href="/fazendas" className="mt-4 inline-block">
              <Button variant="primary">Cadastrar primeira fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const fazendaId = searchParams.fazenda ?? fazendas[0].id;
  const fazendaAtual = fazendas.find((f) => f.id === fazendaId) ?? fazendas[0];

  const piquetes = await prisma.piquete.findMany({
    where: { fazendaId: fazendaAtual.id },
    include: {
      lotes: { select: { id: true, nome: true } },
      historicoRotacao: {
        orderBy: { entradaEm: 'desc' },
        take: 5,
        include: { lote: { select: { nome: true } } },
      },
    },
    orderBy: { nome: 'asc' },
  });

  const agora = new Date();

  const resumo = piquetes.map((p) => {
    const aberto = p.historicoRotacao.find((h) => !h.saidaEm);
    const ultimoFechado = p.historicoRotacao.find((h) => h.saidaEm);
    const diasOcupacao = aberto ? diasEntre(aberto.entradaEm, agora) : 0;
    const diasDescanso = ultimoFechado?.saidaEm
      ? diasEntre(ultimoFechado.saidaEm, agora)
      : null;
    const descansoRestante =
      diasDescanso !== null ? Math.max(0, p.descansoDias - diasDescanso) : null;
    return { piquete: p, aberto, diasOcupacao, diasDescanso, descansoRestante };
  });

  const disponiveis = resumo.filter((r) => !r.aberto).length;
  const ocupados = resumo.filter((r) => r.aberto).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Rotação de pasto</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Histórico de ocupação, tempo de descanso e status por piquete.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label htmlFor="fazenda" className="text-sm text-fg-muted">
            Fazenda
          </label>
          <select
            id="fazenda"
            name="fazenda"
            defaultValue={fazendaAtual.id}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">
            Filtrar
          </Button>
        </form>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Piquetes</p>
            <p className="mt-1 text-2xl font-semibold text-fg">{piquetes.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Ocupados</p>
            <p className="mt-1 text-2xl font-semibold text-fg">{ocupados}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Disponíveis</p>
            <p className="mt-1 text-2xl font-semibold text-fg">{disponiveis}</p>
          </CardBody>
        </Card>
      </section>

      {piquetes.length === 0 ? (
        <Card className="mt-6">
          <CardBody>
            <p className="text-fg-muted">
              Nenhum piquete cadastrado nesta fazenda ainda.
            </p>
            <Link href="/fazendas" className="mt-4 inline-block">
              <Button variant="primary">Cadastrar piquetes</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {resumo.map(({ piquete, aberto, diasOcupacao, diasDescanso, descansoRestante }) => {
            const status = aberto
              ? 'ocupado'
              : descansoRestante !== null && descansoRestante > 0
                ? 'descanso'
                : 'disponivel';
            const badge =
              status === 'ocupado'
                ? 'bg-brand/10 text-brand'
                : status === 'descanso'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-surface text-fg-muted border border-border';
            return (
              <Card key={piquete.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{piquete.nome}</CardTitle>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${badge}`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-fg-muted">
                        {piquete.areaHa} ha · {piquete.tipoPasto ?? 'pasto não informado'} ·
                        descanso alvo {piquete.descansoDias} dias
                      </p>
                    </div>
                    <RotacaoActions
                      piqueteId={piquete.id}
                      aberto={!!aberto}
                      lotes={piquete.lotes.map((l) => ({ id: l.id, nome: l.nome }))}
                    />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs uppercase text-fg-muted">Ocupação atual</dt>
                      <dd className="text-fg">
                        {aberto ? `${diasOcupacao} dias` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-fg-muted">Último descanso</dt>
                      <dd className="text-fg">
                        {diasDescanso !== null ? `${diasDescanso} dias` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-fg-muted">Descanso restante</dt>
                      <dd className="text-fg">
                        {descansoRestante !== null ? `${descansoRestante} dias` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-fg-muted">Lote atual</dt>
                      <dd className="text-fg">{aberto?.lote?.nome ?? '—'}</dd>
                    </div>
                  </dl>

                  {piquete.historicoRotacao.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-fg-muted">
                          <tr>
                            <th className="py-1 pr-3">Entrada</th>
                            <th className="py-1 pr-3">Saída</th>
                            <th className="py-1 pr-3">Dias ocup.</th>
                            <th className="py-1 pr-3">Lote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {piquete.historicoRotacao.map((h) => (
                            <tr key={h.id} className="border-t border-border">
                              <td className="py-1 pr-3 text-fg">
                                {h.entradaEm.toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-1 pr-3 text-fg">
                                {h.saidaEm
                                  ? h.saidaEm.toLocaleDateString('pt-BR')
                                  : 'em curso'}
                              </td>
                              <td className="py-1 pr-3 text-fg">
                                {h.diasOcupacao ?? '—'}
                              </td>
                              <td className="py-1 pr-3 text-fg-muted">
                                {h.lote?.nome ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
