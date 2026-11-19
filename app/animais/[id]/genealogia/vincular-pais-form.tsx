'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Opcao = { id: string; brinco: string; nome: string | null; raca: string | null };

export function VincularPaisForm({
  animalId,
  maeAtualId,
  paiAtualId,
  femeas,
  machos,
}: {
  animalId: string;
  maeAtualId: string | null;
  paiAtualId: string | null;
  femeas: Opcao[];
  machos: Opcao[];
}) {
  const router = useRouter();
  const [maeId, setMaeId] = useState(maeAtualId ?? '');
  const [paiId, setPaiId] = useState(paiAtualId ?? '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/animais/${animalId}/genealogia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maeId: maeId || null,
          paiId: paiId || null,
        }),
      });
      if (!res.ok) throw new Error('Falha');
      setMsg('Genealogia atualizada.');
      router.refresh();
    } catch {
      setMsg('Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Mãe</label>
        <select
          value={maeId}
          onChange={(e) => setMaeId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <option value="">— Não informada —</option>
          {femeas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.brinco} — {f.nome ?? 'sem nome'} ({f.raca ?? '—'})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Pai</label>
        <select
          value={paiId}
          onChange={(e) => setPaiId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <option value="">— Não informado —</option>
          {machos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.brinco} — {m.nome ?? 'sem nome'} ({m.raca ?? '—'})
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar genealogia'}
        </Button>
        {msg && <p className="text-xs text-fg-muted">{msg}</p>}
      </div>
    </form>
  );
}
