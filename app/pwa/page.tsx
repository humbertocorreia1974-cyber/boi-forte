import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PwaInstallButton } from './pwa-install-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App mobile offline-first (PWA + APK) | Boi Forte',
  description:
    'Instale o Boi Forte no celular como PWA ou baixe o APK Android para lançar pesagens no curral mesmo sem internet.',
  openGraph: {
    title: 'App mobile offline-first (PWA + APK) | Boi Forte',
    description:
      'PWA instalável e APK Android para lançamento de pesagens offline no curral.',
  },
};

export default async function PwaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const [fazendas, pesagensPendentes] = await Promise.all([
    prisma.fazenda.count({ where: { ownerId: session.user.id } }),
    prisma.pesagem.count({
      where: {
        animal: { fazenda: { ownerId: session.user.id } },
        origem: 'offline',
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-fg">
          App mobile offline-first
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Leve o Boi Forte pro curral. Instale como PWA no celular ou baixe o APK
          Android — pesagens e aplicações são gravadas localmente e sincronizam
          quando a internet voltar.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle className="text-base">Instalar como PWA</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Adicione o Boi Forte à tela inicial do seu celular. Funciona em
              Android, iOS e desktop, sem passar pela loja.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-fg-muted">
              <li>· Cache de telas e dados essenciais</li>
              <li>· Lançamento de pesagens sem internet</li>
              <li>· Sincronização automática ao reconectar</li>
            </ul>
            <div className="mt-4">
              <PwaInstallButton />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="text-base">APK Android (APKMASTER)</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Baixe o APK assinado para instalar em celulares e tablets do campo.
              Ideal para capatazes que trabalham em áreas sem sinal.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-fg-muted">
              <li>· Modo offline total (SQLite local)</li>
              <li>· Leitura de balança via Bluetooth</li>
              <li>· Sync idempotente com o servidor</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/api/pwa/apk"
                className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-all duration-150 hover:opacity-90"
              >
                Baixar APK
              </a>
              <Link href="/mobile">
                <Button variant="secondary" size="sm">
                  Ver painel mobile
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">
              Fazendas vinculadas
            </p>
            <p className="mt-2 text-2xl font-semibold text-fg">{fazendas}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">
              Pesagens capturadas offline
            </p>
            <p className="mt-2 text-2xl font-semibold text-fg">
              {pesagensPendentes}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">
              Versão do app
            </p>
            <p className="mt-2 text-2xl font-semibold text-fg">1.0.0</p>
          </CardBody>
        </Card>
      </section>

      <section className="mt-10">
        <Card>
          <CardBody>
            <CardTitle className="text-base">Como funciona a sincronização</CardTitle>
            <ol className="mt-3 space-y-2 text-sm text-fg-muted">
              <li>
                <span className="text-fg">1.</span> O capataz lança pesagens no
                curral — ficam salvas no dispositivo.
              </li>
              <li>
                <span className="text-fg">2.</span> Ao reconectar, o app envia em
                lote para <code className="text-fg">/api/pesagens/sync</code> com
                uma chave de idempotência por lançamento.
              </li>
              <li>
                <span className="text-fg">3.</span> O servidor recalcula GMD e
                peso atual — nunca confia no valor enviado pelo cliente.
              </li>
              <li>
                <span className="text-fg">4.</span> Conflitos são resolvidos pela
                data da pesagem; lançamentos duplicados são descartados.
              </li>
            </ol>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
