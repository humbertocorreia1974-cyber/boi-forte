type AnimalNode = {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string | null;
  sexo: string;
};

type AnimalComPais = AnimalNode & {
  mae: AnimalNode | null;
  pai: AnimalNode | null;
};

function No({ animal, label }: { animal: AnimalNode | null; label: string }) {
  if (!animal) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/70 p-3 text-center">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="text-sm text-fg-muted">Não informado</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-center shadow-sm">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="text-sm font-medium text-fg">{animal.nome ?? animal.brinco}</p>
      <p className="text-xs text-fg-muted">
        Brinco {animal.brinco} · {animal.raca ?? '—'}
      </p>
    </div>
  );
}

export function ArvoreGenealogica({ animal }: { animal: AnimalComPais }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <No animal={animal.mae?.mae ?? null} label="Avó materna" />
        <No animal={animal.mae?.pai ?? null} label="Avô materno" />
        <No animal={animal.pai?.mae ?? null} label="Avó paterna" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <No animal={animal.mae} label="Mãe" />
        <No animal={animal.pai} label="Pai" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <No animal={animal.pai?.pai ?? null} label="Avô paterno" />
      </div>
      <div className="mx-auto max-w-sm">
        <div className="rounded-lg border-2 border-brand bg-brand/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-brand">Animal</p>
          <p className="text-base font-semibold text-fg">{animal.nome ?? animal.brinco}</p>
          <p className="text-xs text-fg-muted">
            Brinco {animal.brinco} · {animal.raca ?? '—'} · {animal.sexo}
          </p>
        </div>
      </div>
    </div>
  );
}
