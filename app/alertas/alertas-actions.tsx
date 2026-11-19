'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export default function AlertasActions() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function disparar() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/alertas', { method: 'POST' });
      const data = await res.json();
      setMsg(data.enviados > 0 ? `${data.enviados} alerta(s) enviado(s) por e-mail.` : 'Nenhum alerta crítico para enviar.');
    } catch {
      setMsg('Falha ao enviar alertas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      <Button onClick={disparar} disabled={loading} variant="primary" size="md">
        <Bell className="mr-2 h-4 w-4" />
        {loading ? 'Enviando…' : 'Notificar agora'}
      </Button>
    </div>
  );
}
