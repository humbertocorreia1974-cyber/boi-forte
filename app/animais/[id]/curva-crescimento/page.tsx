import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurvaChart } from './curva-chart';
import { MetaRacaForm } from './meta-raca-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Curva de crescimento | Boi Forte',
  description: 'Acompanhe a curva de crescimento do animal versus a meta da raça.',
  openGraph: {
    title: 'Curva de crescimento | Boi Forte',
    description: 'Peso real x meta da raça, com GMD e projeção.',
  },
};

const METAS_RACA: Record<string, { pesoDesmama: number; pesoAno: number; pesoAdulto: number }> = {
  Nelore: { pesoDesmama: 180, pesoAno: 260, pesoAdulto: 480 },
  Angus: { pesoDesmama: 220, pesoAno: 320, pesoAdulto: 550 },
  Hereford: { pesoDesmama: 210, pesoAno: 300, pesoAdulto: 520 },
  Brahman: { pesoDesmama: 200, pesoAno: 290, pesoAdulto: 540 },
  Senepol: { pesoDesmama: 205, pesoAno: 295, pesoAdulto: 500 },
  'Cruzado Industrial': { pesoDesmama: 230, pesoAno: 330, pesoAdulto: 560 },
};

function metaPorIdade(raca: string | null, meses: number) {
  const meta = METAS_RACA[raca ?? 'Nelore'] ?? METAS_RACA.Nelore;
  if (meses <= 8) return (meta.pesoDesmama / 8) * meses;
  if (meses <= 12) return meta.pesoDesmama + ((meta.pesoAno - meta.pesoDesmama) / 4) * (meses - 8);
  if (meses <= 24) return meta.pesoAno + ((meta.pesoAdulto - meta.pesoAno) / 12) * (meses - 12);
  return meta.pesoAdulto;
}

export default async function CurvaCrescimentoPage({
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
      pesagens: { orderBy: { data: 'asc' } },
    },
  });

  if (!animal) notFound();
  if (animal.fazenda.ownerId !== session.user.id && session.user.role !== 'admin') {
    redirect('/');
  }

  const nascimento = animal.dataNascimento ?? animal.createdAt;
  const pontos = animal.pesagens.map((p) => {
    const meses = Math.max(
      0,
      (p.data.getTime() - nascimento.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    );
    return {
      idadeMeses: Number(meses.toFixed(1)),
      pesoKg: p.pesoKg,
      metaKg: Number(metaPorIdade(animal.raca, meses).toFixed(1)),
      data: p.data.toISOString().slice(0, 10),
    };
  });

  const ultimo = animal.pesagens[animal.pesagens.length - 1];
  const pesoAtual = ultimo?.pesoKg ?? animal.pesoAtualKg ?? 0;
  const idadeAtualMeses = Math.max(
    0,
    (Date.now() - nascimento.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );
  const metaAtual = metaPorIdade(animal.raca, idadeAtualMeses);
  const gap = pesoAtual - metaAtual;
  const gmd = animal.gmdAtual ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            {animal.fazenda.nome} · {animal.raca ?? 'Sem raça'}
          </p>
          <h1 className="text-2xl font-semibold text-fg">
            Curva de crescimento — {animal.nome ?? animal.brinco}
          </h1>
          <p className="text-sm text-fg-muted">
            Brinco {animal.brinco} · {animal.categoria} · {animal.sexo}
          </p>
        </div>
        <Link href={`/animais/${animal.id}`}>
          <Button variant="secondary" size="sm">
            Voltar ao animal
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-fg-muted">Peso atual</p>
            <p className="text-2xl font-semibold text-fg">{pesoAtual.toFixed(1)} kg</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-fg-muted">Meta da raça ({animal.raca ?? 'Nelore'})</p>
            <p className="text-2xl font-semibold text-fg">{metaAtual.toFixed(1)} kg</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-fg-muted">Gap vs meta</p>
            <p
              className={`text-2xl font-semibold ${
                gap >= 0 ? 'text-brand' : 'text-fg'
              }`}
            >
              {gap >= 0 ? '+' : ''}
              {gap.toFixed(1)} kg
            </p>
            <p className="text-xs text-fg-muted">GMD atual {gmd.toFixed(3)} kg/dia</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <CardTitle className="mb-3">Peso real x meta</CardTitle>
          {pontos.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface/70 p-6 text-center">
              <p className="text-sm text-fg-muted">
                Nenhuma pesagem registrada ainda. Lance a primeira pesagem para ver a curva.
              </p>
              <Link href={`/animais/${animal.id}/pesagens/nova`} className="mt-3 inline-block">
                <Button size="sm">Lançar pesagem</Button>
              </Link>
            </div>
          ) : (
            <CurvaChart pontos={pontos} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle className="mb-3">Ajustar meta da raça</CardTitle>
          <p className="mb-3 text-sm text-fg-muted">
            Sobrescreve a meta padrão de {animal.raca ?? 'Nelore'} para este animal.
          </p>
          <MetaRacaForm
            animalId={animal.id}
            raca={animal.raca ?? 'Nelore'}
            pesoAlvoAtual={animal.pesoAlvoKg ?? null}
          />
        </CardBody>
      </Card>
    </div>
  );
}
