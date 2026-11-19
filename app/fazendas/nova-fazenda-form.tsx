'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export function NovaFazendaForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      nome: String(fd.get('nome') || '').trim(),
      cnpj: String(fd.get('cnpj') || '').trim() || null,
      cidade: String(fd.get('cidade') || '').trim() || null,
      uf: String(fd.get('uf') || '').trim().toUpperCase() || null,
      areaTotalHa: fd.get('areaTotalHa') ? Number(fd.get('areaTotalHa')) : null,
    };
    const res = await fetch('/api/fazendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErro(j.error || 'Não foi possível criar a fazenda.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="md">
        <Plus className="mr-1 h-4 w-4" aria-hidden /> Nova fazenda
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Nova fazenda</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-fg-muted hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="nome" placeholder="Nome da fazenda" required className="sm:col-span-2" />
        <Input name="cnpj" placeholder="CNPJ (opcional)" />
        <Input name="areaTotalHa" type="number" step="0.1" placeholder="Área total (ha)" />
        <Input name="cidade" placeholder="Cidade" />
        <Input name="uf" placeholder="UF" maxLength={2} />
      </div>
      {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Salvando…' : 'Criar'}</Button>
      </div>
    </form>
  );
}
