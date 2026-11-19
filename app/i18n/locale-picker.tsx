'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LOCALES, type LocaleCode } from '@/lib/i18n-locales';

export function LocalePicker({ current }: { current: LocaleCode }) {
  const router = useRouter();
  const [selected, setSelected] = useState<LocaleCode>(current);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/i18n/preferencia', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: selected }),
    });
    if (!res.ok) {
      setErr('Não foi possível salvar. Tente novamente.');
      return;
    }
    setMsg('Idioma atualizado.');
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {LOCALES.map((l) => {
          const active = l.code === selected;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setSelected(l.code)}
              aria-pressed={active}
              className={
                'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all duration-150 ' +
                (active
                  ? 'border-brand bg-brand/10 text-fg'
                  : 'border-border bg-surface/70 text-fg-muted hover:bg-white/5')
              }
            >
              <span aria-hidden className="text-lg">{l.flag}</span>
              <span className="truncate">{l.native}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || selected === current}>
          {pending ? 'Salvando…' : 'Salvar idioma'}
        </Button>
        {msg && <span className="text-xs text-brand">{msg}</span>}
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
    </div>
  );
}
