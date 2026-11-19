'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AlertaAcaoClient({ fazendas }: { fazendas: { id: string; nome: string }[] }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function disparar() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'alerta',
          titulo: 'Resumo de alertas Boi Forte',
          mensagem: 'Você tem alertas de estoque e sanidade pendentes. Abra o painel para detalhes.',
          fazendaId: fazendas[0]?.id,
        }),
      });
      if (!res.ok) throw new Error('falha');
      setMsg('Alerta enviado por e-mail e push.');
    } catch {
      setMsg('Não foi possível enviar agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={disparar} disabled={loading}>
        {loading ? 'Enviando…' : 'Notificar-me agora'}
      </Button>
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
    </div>
  );
}
