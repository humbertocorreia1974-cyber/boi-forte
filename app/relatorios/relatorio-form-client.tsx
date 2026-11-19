'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function RelatorioFormClient({ fazendas }: { fazendas: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [fazendaId, setFazendaId] = useState(fazendas[0]?.id ?? '');
  const [tipo, setTipo] = useState('animais');
  const [formato, setFormato] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/relatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fazendaId, tipo, formato }),
      });
      if (!res.ok) throw new Error('falha');
      setMsg('Relatório gerado. Baixe no histórico.');
      router.refresh();
    } catch {
      setMsg('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-fg-muted">
        Fazenda
        <select
          value={fazendaId}
          onChange={(e) => setFazendaId(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
        >
          {fazendas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-fg-muted">
        Tipo
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
        >
          <option value="animais">Rebanho</option>
          <option value="pesagens">Pesagens</option>
          <option value="custos">Custos</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-fg-muted">
        Formato
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
        >
          <option value="pdf">PDF</option>
          <option value="excel">Excel (CSV)</option>
        </select>
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? 'Gerando…' : 'Gerar relatório'}
      </Button>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
