import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import BalancaClient from './balanca-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Balança eletrônica | Boi Forte',
  description: 'Conecte balanças eletrônicas por API HTTP ou Bluetooth e lance pesagens direto no curral, sem digitação.',
  openGraph: {
    title: 'Balança eletrônica | Boi Forte',
    description: 'Integração com balanças eletrônicas via API/Bluetooth para pesagem no curral.',
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  const fazendaIds = fazendas.map((f) => f.id);

  const ultimasPesagens = fazendaIds.length
    ? await prisma.pesagem.findMany({
        where: { animal: { fazendaId: { in: fazendaIds } }, origem: 'balanca' },
        orderBy: { data: 'desc' },
        take: 10,
        include: { animal: { select: { brinco: true, nome: true } } },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Balança eletrônica</h1>
          <p className="text-sm text-fg-muted">
            Leitura automática por API HTTP ou Bluetooth. Cada leitura vira uma Pesagem com origem <code>balanca</code>.
          </p>
        </div>
      </header>

      {fazendas.length === 0 ? (
        <Card>
          <CardBody className="space-y-3 text-sm text-fg-muted">
            <p>Você ainda não tem fazendas cadastradas.</p>
            <a href="/fazendas" className="text-brand underline">Cadastrar primeira fazenda</a>
          </CardBody>
        </Card>
      ) : (
        <BalancaClient fazendas={fazendas} />
      )}

      <Card>
        <CardTitle>Últimas pesagens via balança</CardTitle>
        <CardBody>
          {ultimasPesagens.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Nenhuma pesagem via balança registrada ainda. Conecte um dispositivo acima para começar.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="py-2">Brinco</th>
                  <th className="py-2">Animal</th>
                  <th className="py-2">Peso (kg)</th>
                  <th className="py-2">GMD</th>
                  <th className="py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {ultimasPesagens.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2 font-medium text-fg">{p.animal.brinco}</td>
                    <td className="py-2 text-fg-muted">{p.animal.nome ?? '—'}</td>
                    <td className="py-2 text-fg">{p.pesoKg.toFixed(1)}</td>
                    <td className="py-2 text-fg-muted">{p.gmd != null ? p.gmd.toFixed(3) : '—'}</td>
                    <td className="py-2 text-fg-muted">{new Date(p.data).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
