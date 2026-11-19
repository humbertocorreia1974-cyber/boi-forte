import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, WifiOff, Download, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MobileQueueClient } from './mobile-queue-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App Mobile — Lançamento no Curral | Boi Forte',
  description:
    'App capataz offline-first para lançamento de pesagens, sanidade e movimentações direto no curral, com sincronização idempotente quando a conexão volta.',
  openGraph: {
    title: 'App Mobile Boi Forte — offline-first no curral',
    description: 'Lance peso, sanidade e movimentação sem internet. Sincroniza sozinho quando volta o sinal.',
  },
};

export default async function MobilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true, uf: true },
    orderBy: { nome: 'asc' },
  });

  const fazendaIds = fazendas.map((f) => f.id);

  const [pesagensPendentes, ultimaPesagem, totalAnimais] = await Promise.all([
    prisma.pesagem.count({
      where: {
        animal: { fazendaId: { in: fazendaIds } },
        origem: 'offline',
      },
    }),
    prisma.pesagem.findFirst({
      where: { animal: { fazendaId: { in: fazendaIds } } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, origem: true },
    }),
    prisma.animal.count({ where: { fazendaId: { in: fazendaIds }, status: 'ativo' } }),
  ]);

  const temFazenda = fazendas.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Portal do Capataz</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">App Mobile — Lançamento no Curral</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Baixe o APK ou instale o PWA. Funciona 100% offline no curral e sincroniza pesagens,
            aplicações sanitárias e movimentações quando o sinal volta — com Idempotency-Key para
            nunca duplicar lançamento.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/pwa/manifest" target="_blank" rel="noreferrer">
            <Button variant="secondary" size="md">
              <Download className="mr-2 h-4 w-4" /> Manifest PWA
            </Button>
          </a>
          <Link href="/balanca">
            <Button variant="primary" size="md">
              <Smartphone className="mr-2 h-4 w-4" /> Parear balança
            </Button>
          </Link>
        </div>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Fazendas</p>
            <p className="mt-2 text-2xl font-semibold text-fg">{fazendas.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Animais ativos</p>
            <p className="mt-2 text-2xl font-semibold text-fg">{totalAnimais}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Pesagens offline</p>
            <p className="mt-2 text-2xl font-semibold text-brand">{pesagensPendentes}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Última sincronização</p>
            <p className="mt-2 text-sm font-medium text-fg">
              {ultimaPesagem
                ? new Date(ultimaPesagem.createdAt).toLocaleString('pt-BR')
                : 'Nenhuma ainda'}
            </p>
          </CardBody>
        </Card>
      </section>

      {!temFazenda ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-brand" />
            <CardTitle>Nenhuma fazenda cadastrada</CardTitle>
            <p className="max-w-md text-sm text-fg-muted">
              Cadastre uma fazenda antes de parear o app do capataz — o lançamento no curral é
              sempre vinculado a uma fazenda do seu tenant.
            </p>
            <Link href="/fazendas">
              <Button variant="primary" size="md">Cadastrar fazenda</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MobileQueueClient fazendas={fazendas} />
          </div>

          <aside className="space-y-4">
            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-brand" /> Como funciona offline
                </CardTitle>
                <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    Cada lançamento é gravado localmente (IndexedDB) com um Idempotency-Key único.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    Ao voltar o sinal, o app envia em lote para <code className="text-fg">/api/mobile/sync</code>.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    O servidor recalcula GMD e saldo — nunca confia no cliente.
                  </li>
                  <li className="flex gap-2">
                    <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                    Sem sinal? Continua lançando. Nada se perde no curral.
                  </li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-brand" /> Instalar APK
                </CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Build Android gerado via APKMASTER a partir do PWA. Compatível com Android 8+.
                </p>
                <a
                  href="/api/pwa/status?format=apk"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-brand hover:underline"
                >
                  <Download className="h-4 w-4" /> Baixar APK (v1.0.0)
                </a>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-brand" /> Sincronização em lote
                </CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Endpoint idempotente aceita até 500 lançamentos por requisição. Retorna quais
                  foram aceitos, quais já existiam e quais falharam.
                </p>
                <code className="mt-3 block rounded-md border border-border bg-bg/60 p-2 text-xs text-fg-muted">
                  POST /api/mobile/sync
                </code>
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
