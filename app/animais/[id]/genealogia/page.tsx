import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArvoreGenealogica } from './arvore-genealogica';
import { VincularPaisForm } from './vincular-pais-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Árvore genealógica | Boi Forte',
  description: 'Genealogia do bezerro: mãe, pai e ascendentes registrados.',
  openGraph: {
    title: 'Árvore genealógica | Boi Forte',
    description: 'Rastreie a linhagem do animal — mãe, pai e avós.',
  },
};

export default async function GenealogiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      fazenda: { select: { id: true, ownerId: true, nome: true } },
      mae: {
        include: {
          mae: true,
          pai: true,
        },
      },
      pai: {
        include: {
          mae: true,
          pai: true,
        },
      },
      filhosComoMae: { select: { id: true, brinco: true, nome: true, dataNascimento: true } },
      filhosComoPai: { select: { id: true, brinco: true, nome: true, dataNascimento: true } },
    },
  });

  if (!animal) notFound();
  if (animal.fazenda.ownerId !== session.user.id && session.user.role !== 'admin') {
    redirect('/');
  }

  const candidatos = await prisma.animal.findMany({
    where: {
      fazendaId: animal.fazendaId,
      id: { not: animal.id },
      status: 'ativo',
    },
    select: { id: true, brinco: true, nome: true, sexo: true, raca: true },
    orderBy: { brinco: 'asc' },
    take: 200,
  });

  const femeas = candidatos.filter((c) => c.sexo === 'F' || c.sexo === 'femea' || c.sexo === 'fêmea');
  const machos = candidatos.filter((c) => c.sexo === 'M' || c.sexo === 'macho');

  const filhos = [...animal.filhosComoMae, ...animal.filhosComoPai];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">{animal.fazenda.nome}</p>
          <h1 className="text-2xl font-semibold text-fg">
            Genealogia — {animal.nome ?? animal.brinco}
          </h1>
          <p className="text-sm text-fg-muted">
            Brinco {animal.brinco} · {animal.raca ?? 'Sem raça'} · {animal.sexo}
          </p>
        </div>
        <Link href={`/animais/${animal.id}`}>
          <Button variant="secondary" size="sm">
            Voltar ao animal
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardBody>
          <CardTitle className="mb-4">Árvore genealógica</CardTitle>
          {!animal.mae && !animal.pai ? (
            <div className="rounded-lg border border-border bg-surface/70 p-6 text-center">
              <p className="text-sm text-fg-muted">
                Nenhum ascendente vinculado. Vincule a mãe e o pai para montar a árvore.
              </p>
            </div>
          ) : (
            <ArvoreGenealogica animal={animal} />
          )}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <CardTitle className="mb-3">Vincular mãe e pai</CardTitle>
          <VincularPaisForm
            animalId={animal.id}
            maeAtualId={animal.maeId ?? null}
            paiAtualId={animal.paiId ?? null}
            femeas={femeas}
            machos={machos}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle className="mb-3">Descendentes ({filhos.length})</CardTitle>
          {filhos.length === 0 ? (
            <p className="text-sm text-fg-muted">Nenhum filho registrado para este animal.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filhos.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <Link href={`/animais/${f.id}/genealogia`} className="text-sm text-fg hover:text-brand">
                    {f.nome ?? f.brinco} (brinco {f.brinco})
                  </Link>
                  <span className="text-xs text-fg-muted">
                    {f.dataNascimento ? f.dataNascimento.toISOString().slice(0, 10) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
