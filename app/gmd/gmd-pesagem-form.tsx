'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AnimalOpt = { id: string; brinco: string; nome: string | null };

export function GmdPesagemForm({ animais }: { animais: AnimalOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      animalId: String(fd.get('animalId') ?? ''),
      pesoKg: Number(fd.get('pesoKg') ?? 0),
      data: String(fd.get('data') ?? ''),
      observacao: String(fd.get('observacao') ?? ''),
    };
    const res = await fetch('/api/pesagens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `${body.animalId}-${body.data}-${body.pesoKg}`,
      },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? 'Falha ao registrar pesagem.');
      return;
    }
    setMsg('Pesagem registrada. GMD recalculado.');
    router.refresh();
  }

  if (!open) {
    return <Button variant="primary" onClick={() => setOpen(true)}>+ Nova pesagem</Button>;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-border bg-surface p-4">
      <div className="grid gap-3">
        <select
          name="animalId"
          required
          className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
        >
          <option value="">Selecione o animal</option>
          {animais.map(a => (
            <option key={a.id} value={a.id}>
              {a.brinco}{a.nome ? ` · ${a.nome}` : ''}
            </option>
          ))}
        </select>
        <Input name="pesoKg" type="number" step="0.1" min="1" placeholder="Peso (kg)" required />
        <Input name="data" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        <Input name="observacao" placeholder="Observação (opcional)" />
        {msg && <p className="text-xs text-fg-muted">{msg}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
        </div>
      </div>
    </form>
  );
}
