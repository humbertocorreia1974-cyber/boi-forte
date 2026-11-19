import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Tractor, Beef, Grid3x3 } from 'lucide-react';
import { NovaFazendaForm } from './nova-fazenda-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fazendas | Boi Forte',
  description: 'Multi-fazenda com isolamento de dados: gerencie todas as suas unidades produtivas em um só lugar.',
  openGraph: { title: 'Fazendas | Boi Forte', description: 'Multi-fazenda com isolamento de dados.' },
};

export default async function FazendasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { animais: true, piquetes: true, lotes: true } },
    },
  });

  const totalArea = fazendas.reduce((s, f) => s + (f.areaTotalHa ?? 0), 0);
  const totalAnimais = fazendas.reduce((s, f) => s + f._count.animais, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Minhas fazendas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {fazendas.length} unidade{fazendas.length === 1 ? '' : 's'} · {totalArea.toFixed(1)} ha · {totalAnimais} animais
          </p>
        </div>
        <NovaFazendaForm />
      </header>

      {fazendas.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <Tractor className="h-10 w-10 text-fg-muted" aria-hidden />
            <p className="text-fg">Você ainda não cadastrou nenhuma fazenda.</p>
            <p className="text-sm text-fg-muted">Cadastre a primeira unidade para começar a lançar animais, piquetes e custos.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fazendas.map((f) => (
            <Card key={f.id} className="transition-all duration-150 hover:bg-white/5">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{f.nome}</CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${f.ativa ? 'bg-brand/10 text-brand' : 'bg-surface text-fg-muted'}`}>
                    {f.ativa ? 'ativa' : 'inativa'}
                  </span>
                </div>
                {(f.cidade || f.uf) && (
                  <p className="flex items-center gap-1 text-xs text-fg-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {[f.cidade, f.uf].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="rounded-md border border-border bg-bg/40 p-2">
                    <Beef className="mx-auto h-4 w-4 text-fg-muted" aria-hidden />
                    <p className="mt-1 text-sm font-semibold text-fg">{f._count.animais}</p>
                    <p className="text-[10px] uppercase tracking-wide text-fg-muted">animais</p>
                  </div>
                  <div className="rounded-md border border-border bg-bg/40 p-2">
                    <Grid3x3 className="mx-auto h-4 w-4 text-fg-muted" aria-hidden />
                    <p className="mt-1 text-sm font-semibold text-fg">{f._count.piquetes}</p>
                    <p className="text-[10px] uppercase tracking-wide text-fg-muted">piquetes</p>
                  </div>
                  <div className="rounded-md border border-border bg-bg/40 p-2">
                    <Tractor className="mx-auto h-4 w-4 text-fg-muted" aria-hidden />
                    <p className="mt-1 text-sm font-semibold text-fg">{(f.areaTotalHa ?? 0).toFixed(0)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-fg-muted">ha</p>
                  </div>
                </div>
                <Link href={`/fazendas/${f.id}`} className="block pt-1">
                  <Button variant="secondary" size="sm" className="w-full">Abrir painel</Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
