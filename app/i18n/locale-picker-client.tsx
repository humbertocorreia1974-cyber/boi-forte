'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Locale = { code: string; label: string; flag: string };

export default function LocalePicker({ current, locales }: { current: string; locales: Locale[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    setMsg(null);
    const res = await fetch('/api/i18n/preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: selected }),
    });
    if (!res.ok) {
      setMsg('Não foi possível salvar. Tente novamente.');
      return;
    }
    setMsg('Idioma atualizado.');
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {locales.map((l) => {
          const active = l.code === selected;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setSelected(l.code)}
              className={
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all duration-150 ' +
                (active
                  ? 'border-brand bg-brand/10 text-fg'
                  : 'border-border bg-surface text-fg-muted hover:bg-white/5')
              }
            >
              <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-fg-muted">
                {l.flag}
              </span>
              <span className="truncate">{l.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={salvar} disabled={pending || selected === current}>
          {pending ? 'Salvando…' : 'Salvar idioma'}
        </Button>
        {msg && <span className="text-sm text-fg-muted">{msg}</span>}
      </div>
    </div>
  );
}
