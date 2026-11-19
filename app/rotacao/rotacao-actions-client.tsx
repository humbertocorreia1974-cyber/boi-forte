'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Lote = { id: string; nome: string };

export function RotacaoActions({
  piqueteId,
  aberto,
  lotes,
}: {
  piqueteId: string;
  aberto: boolean;
  lotes: Lote[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string>(lotes[0]?.id ?? '');

  async function acao(tipo: 'entrada' | 'saida') {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/piquetes/${piqueteId}/rotacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `${piqueteId}-${tipo}-${Date.now()}`,
        },
        body: JSON.stringify({ tipo, loteId: tipo === 'entrada' ? loteId : undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Falha ao registrar rotação');
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (aberto) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => acao('saida')}
          disabled={loading}
        >
          {loading ? 'Registrando…' : 'Fechar ocupação'}
        </Button>
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg"
        >
          <option value="">Sem lote</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          onClick={() => acao('entrada')}
          disabled={loading}
        >
          {loading ? 'Registrando…' : 'Abrir ocupação'}
        </Button>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
}
