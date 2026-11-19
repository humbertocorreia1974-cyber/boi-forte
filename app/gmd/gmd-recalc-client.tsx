'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function GmdRecalcButton({ fazendaId }: { fazendaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function recalc() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gmd/recalcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ fazendaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao recalcular');
      setMsg(`GMD recalculado para ${data.atualizados} animais.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={recalc}
        disabled={loading}
      >
        {loading ? 'Recalculando…' : 'Recalcular GMD'}
      </Button>
    </div>
  );
}
