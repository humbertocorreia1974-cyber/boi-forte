'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Candidato = {
  id: string;
  brinco: string;
  nome: string | null;
  sexo: string;
  categoria: string;
};

export default function GenealogiaForm({
  animalId,
  maeAtualId,
  paiAtualId,
  candidatos,
}: {
  animalId: string;
  maeAtualId: string | null;
  paiAtualId: string | null;
  candidatos: Candidato[];
}) {
  const router = useRouter();
  const [maeId, setMaeId] = useState(maeAtualId ?? '');
  const [paiId, setPaiId] = useState(paiAtualId ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const femeas = candidatos.filter((c) => c.sexo === 'F');
  const machos = candidatos.filter((c) => c.sexo === 'M');

  async function salvar() {
    setErro(null);
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/animais/${animalId}/genealogia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maeId: maeId || null,
          paiId: paiId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? 'Falha ao salvar vínculo');
        return;
      }
      setOk(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col text-xs text-fg-muted">
        Mãe
        <select
          value={maeId}
          onChange={(e) => setMaeId(e.target.value)}
          className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">— Sem mãe registrada —</option>
          {femeas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome ?? c.brinco} ({c.brinco})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-fg-muted">
        Pai
        <select
          value={paiId}
          onChange={(e) => setPaiId(e.target.value)}
          className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">— Sem pai registrado —</option>
          {machos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome ?? c.brinco} ({c.brinco})
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button onClick={salvar} disabled={loading} size="sm">
          {loading ? 'Salvando...' : 'Salvar vínculo'}
        </Button>
        {ok && <span className="text-xs text-brand">Vínculo atualizado.</span>}
        {erro && <span className="text-xs text-red-500">{erro}</span>}
      </div>
    </div>
  );
}
