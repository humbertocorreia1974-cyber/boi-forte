'use client';

import Link from 'next/link';

export type NoGenealogia = {
  id: string;
  brinco: string;
  nome: string | null;
  sexo: string;
  raca: string | null;
  categoria: string;
  dataNascimento: string | null;
  mae: NoGenealogia | null;
  pai: NoGenealogia | null;
};

function No({ no, rotulo }: { no: NoGenealogia | null; rotulo: string }) {
  if (!no) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/40 px-3 py-2 text-xs text-fg-muted">
        {rotulo}: não informado
      </div>
    );
  }
  return (
    <Link
      href={`/animais/${no.id}/genealogia`}
      className="block rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm transition-all duration-150 hover:bg-white/5"
    >
      <div className="text-[10px] uppercase tracking-wide text-fg-muted">
        {rotulo}
      </div>
      <div className="mt-0.5 font-medium text-fg">
        {no.brinco}
        {no.nome ? ` — ${no.nome}` : ''}
      </div>
      <div className="mt-0.5 text-[10px] text-fg-muted">
        {no.sexo === 'M' ? 'Macho' : 'Fêmea'} · {no.raca ?? 's/ raça'}
      </div>
    </Link>
  );
}

function Ramo({ no, nivel }: { no: NoGenealogia; nivel: number }) {
  if (nivel === 0) return null;
  return (
    <div className="flex flex-col gap-3 border-l border-border pl-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <No no={no.mae} rotulo="Mãe" />
        <No no={no.pai} rotulo="Pai" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          {no.mae && <Ramo no={no.mae} nivel={nivel - 1} />}
        </div>
        <div>
          {no.pai && <Ramo no={no.pai} nivel={nivel - 1} />}
        </div>
      </div>
    </div>
  );
}

export function GenealogiaTree({ raiz }: { raiz: NoGenealogia }) {
  return (
    <div className="min-w-[560px]">
      <Link
        href={`/animais/${raiz.id}/genealogia`}
        className="inline-block rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 text-sm shadow-sm transition-all duration-150 hover:bg-brand/20"
      >
        <div className="text-[10px] uppercase tracking-wide text-brand">
          Animal
        </div>
        <div className="mt-0.5 font-semibold text-fg">
          {raiz.brinco}
          {raiz.nome ? ` — ${raiz.nome}` : ''}
        </div>
        <div className="mt-0.5 text-[10px] text-fg-muted">
          {raiz.sexo === 'M' ? 'Macho' : 'Fêmea'} · {raiz.raca ?? 's/ raça'}
        </div>
      </Link>
      <div className="mt-4">
        <Ramo no={raiz} nivel={4} />
      </div>
    </div>
  );
}
