'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, WifiOff, Upload, Plus, Trash2, CheckCircle2 } from 'lucide-react';

type Fazenda = { id: string; nome: string; uf: string | null };
type QueueItem = {
  key: string;
  fazendaId: string;
  animalBrinco: string;
  pesoKg: number;
  criadoEm: string;
};

const STORAGE_KEY = 'boiforte.offline.queue';

export function MobileQueueClient({ fazendas }: { fazendas: Fazenda[] }) {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [fazendaId, setFazendaId] = useState(fazendas[0]?.id ?? '');
  const [brinco, setBrinco] = useState('');
  const [peso, setPeso] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setQueue(JSON.parse(raw));
    } catch {}
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  function persist(next: QueueItem[]) {
    setQueue(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function addItem() {
    const pesoNum = Number(peso.replace(',', '.'));
    if (!fazendaId || !brinco.trim() || !pesoNum || pesoNum <= 0) {
      setMsg('Preencha fazenda, brinco e peso válido.');
      return;
    }
    const item: QueueItem = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fazendaId,
      animalBrinco: brinco.trim(),
      pesoKg: pesoNum,
      criadoEm: new Date().toISOString(),
    };
    persist([item, ...queue]);
    setBrinco('');
    setPeso('');
    setMsg('Lançamento salvo offline. Sincronize quando tiver sinal.');
  }

  function removeItem(key: string) {
    persist(queue.filter((q) => q.key !== key));
  }

  async function sync() {
    if (queue.length === 0) {
      setMsg('Fila vazia — nada para sincronizar.');
      return;
    }
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/mobile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha na sincronização');
      const aceitos = new Set<string>((data.accepted ?? []).map((a: any) => a.key));
      const restantes = queue.filter((q) => !aceitos.has(q.key));
      persist(restantes);
      setMsg(
        `Sincronizado: ${data.accepted?.length ?? 0} aceitos, ${data.duplicated?.length ?? 0} duplicados, ${data.failed?.length ?? 0} falhas.`,
      );
    } catch (e: any) {
      setMsg(e?.message ?? 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-4 w-4 text-brand" />
            ) : (
              <WifiOff className="h-4 w-4 text-fg-muted" />
            )}
            Fila offline ({queue.length})
          </CardTitle>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              online ? 'bg-brand/10 text-brand' : 'bg-fg-muted/10 text-fg-muted'
            }`}
          >
            {online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <select
            value={fazendaId}
            onChange={(e) => setFazendaId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} {f.uf ? `(${f.uf})` : ''}
              </option>
            ))}
          </select>
          <Input
            placeholder="Brinco do animal"
            value={brinco}
            onChange={(e) => setBrinco(e.target.value)}
          />
          <Input
            placeholder="Peso (kg)"
            inputMode="decimal"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
          <Button variant="primary" size="md" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> Lançar
          </Button>
        </div>

        {msg && (
          <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
            <CheckCircle2 className="h-4 w-4 text-brand" /> {msg}
          </p>
        )}

        <div className="mt-5 overflow-x-auto">
          {queue.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-fg-muted">
              Nenhum lançamento na fila. Registre um peso acima para começar.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                  <th className="py-2">Brinco</th>
                  <th className="py-2">Peso</th>
                  <th className="py-2">Criado em</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.key} className="border-t border-border">
                    <td className="py-2 text-fg">{q.animalBrinco}</td>
                    <td className="py-2 text-fg">{q.pesoKg} kg</td>
                    <td className="py-2 text-fg-muted">
                      {new Date(q.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeItem(q.key)}
                        className="rounded-md p-1 text-fg-muted transition-all duration-150 hover:bg-white/5 hover:text-fg"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="md" onClick={sync} disabled={syncing}>
            <Upload className="mr-2 h-4 w-4" />
            {syncing ? 'Sincronizando...' : 'Sincronizar fila'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
