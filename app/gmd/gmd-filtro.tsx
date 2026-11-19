'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Fazenda = { id: string; nome: string };
type Lote = { id: string; nome: string };

export function GmdFiltro({
  fazendas,
  lotes,
  fazendaId,
  loteId,
  q,
}: {
  fazendas: Fazenda[];
  lotes: Lote[];
  fazendaId: string;
  loteId?: string;
  q: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'fazenda') next.delete('lote');
    router.push(`/gmd?${next.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        update('q', String(fd.get('q') ?? ''));
      }}
    >
      <select
        value={fazendaId}
        onChange={e => update('fazenda', e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
      >
        {fazendas.map(f => (
          <option key={f.id} value={f.id}>{f.nome}</option>
        ))}
      </select>
      <select
        value={loteId ?? ''}
        onChange={e => update('lote', e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
      >
        <option value="">Todos os lotes</option>
        {lotes.map(l => (
          <option key={l.id} value={l.id}>{l.nome}</option>
        ))}
      </select>
      <Input name="q" defaultValue={q} placeholder="Brinco ou nome" className="w-48" />
      <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
    </form>
  );
}
