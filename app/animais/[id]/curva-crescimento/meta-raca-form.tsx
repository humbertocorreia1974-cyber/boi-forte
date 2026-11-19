'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MetaRacaForm({
  animalId,
  raca,
  pesoAlvoAtual,
}: {
  animalId: string;
  raca: string;
  pesoAlvoAtual: number | null;
}) {
  const router = useRouter();
  const [peso, setPeso] = useState(pesoAlvoAtual?.toString() ?? '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/animais/${animalId}/meta-raca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesoAlvoKg: Number(peso), raca }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setMsg('Meta atualizada.');
      router.refresh();
    } catch {
      setMsg('Não foi possível salvar a meta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs text-fg-muted">Peso alvo (kg)</label>
        <Input
          type="number"
          step="0.1"
          min={0}
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          placeholder="Ex: 480"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar meta'}
      </Button>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
