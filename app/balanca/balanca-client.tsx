'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardBody } from '@/components/ui/card';

type Fazenda = { id: string; nome: string };

type Leitura = { pesoKg: number; brinco: string; origem: 'api' | 'bluetooth'; at: string };

const BT_SERVICE = '0000181d-0000-1000-8000-00805f9b34fb';

export default function BalancaClient({ fazendas }: { fazendas: Fazenda[] }) {
  const [fazendaId, setFazendaId] = useState(fazendas[0]?.id ?? '');
  const [endpoint, setEndpoint] = useState('');
  const [brinco, setBrinco] = useState('');
  const [peso, setPeso] = useState('');
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [btSupported, setBtSupported] = useState(false);
  const deviceRef = useRef<unknown>(null);

  useEffect(() => {
    setBtSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator);
  }, []);

  async function registrarLeitura(pesoKg: number, origem: 'api' | 'bluetooth', brincoOverride?: string) {
    const b = (brincoOverride ?? brinco).trim();
    if (!b) {
      setStatus('Informe o brinco do animal antes de registrar.');
      return;
    }
    const res = await fetch('/api/balanca/leitura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ fazendaId, brinco: b, pesoKg, origem }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(err.error ?? 'Falha ao registrar leitura.');
      return;
    }
    setLeituras((prev) => [{ pesoKg, brinco: b, origem, at: new Date().toISOString() }, ...prev].slice(0, 20));
    setStatus(`Leitura registrada: ${pesoKg.toFixed(1)} kg (${origem}).`);
    setPeso('');
  }

  async function lerViaApi() {
    if (!endpoint) {
      setStatus('Informe o endpoint HTTP da balança.');
      return;
    }
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const match = text.match(/-?\d+([.,]\d+)?/);
      if (!match) throw new Error('Sem peso no retorno');
      const kg = parseFloat(match[0].replace(',', '.'));
      await registrarLeitura(kg, 'api');
    } catch (e) {
      setStatus('Erro na leitura HTTP: ' + (e instanceof Error ? e.message : 'desconhecido'));
    }
  }

  async function conectarBluetooth() {
    if (!btSupported) {
      setStatus('Web Bluetooth indisponível neste navegador. Use o app Android (APK) para Bluetooth nativo.');
      return;
    }
    try {
      const nav = navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<unknown> } };
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [BT_SERVICE] }],
        optionalServices: [BT_SERVICE],
      });
      deviceRef.current = device;
      setStatus('Dispositivo Bluetooth selecionado. Digite o peso lido no visor e clique em Registrar.');
    } catch (e) {
      setStatus('Bluetooth cancelado ou indisponível.');
    }
  }

  function registrarManualBt() {
    const kg = parseFloat(peso.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) {
      setStatus('Peso inválido.');
      return;
    }
    registrarLeitura(kg, 'bluetooth');
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardTitle>Conexão</CardTitle>
        <CardBody className="space-y-3">
          <label className="block text-sm">
            <span className="text-fg-muted">Fazenda</span>
            <select
              value={fazendaId}
              onChange={(e) => setFazendaId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg"
            >
              {fazendas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-fg-muted">Brinco do animal</span>
            <Input value={brinco} onChange={(e) => setBrinco(e.target.value)} placeholder="Ex: 4521" />
          </label>

          <label className="block text-sm">
            <span className="text-fg-muted">Endpoint HTTP da balança (opcional)</span>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://192.168.0.42/peso"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={lerViaApi} variant="primary">Ler via API</Button>
            <Button onClick={conectarBluetooth} variant="secondary">Conectar Bluetooth</Button>
          </div>

          <div className="border-t border-border pt-3">
            <label className="block text-sm">
              <span className="text-fg-muted">Peso manual (kg) — do visor da balança</span>
              <Input value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex: 412.5" />
            </label>
            <Button className="mt-2" onClick={registrarManualBt} variant="primary">Registrar leitura</Button>
          </div>

          {status && <p className="text-xs text-fg-muted">{status}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardTitle>Leituras desta sessão</CardTitle>
        <CardBody>
          {leituras.length === 0 ? (
            <p className="text-sm text-fg-muted">Nenhuma leitura ainda. Conecte a balança ou registre manualmente.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {leituras.map((l, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                  <span className="text-fg">Brinco {l.brinco}</span>
                  <span className="text-fg-muted">{l.pesoKg.toFixed(1)} kg · {l.origem}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
