'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, CardBody } from '@/components/ui/card';

type Dict = Record<string, string>;

export function DictionaryPreview({ locale }: { locale: string }) {
  const [dict, setDict] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/i18n/${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setDict(d?.dictionary ?? {});
      })
      .catch(() => alive && setDict({}))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [locale]);

  const entries = dict ? Object.entries(dict).slice(0, 12) : [];

  return (
    <Card>
      <CardTitle>Amostra do dicionário · {locale}</CardTitle>
      <CardBody>
        {loading && <p className="text-sm text-fg-muted">Carregando chaves…</p>}
        {!loading && entries.length === 0 && (
          <p className="text-sm text-fg-muted">
            Nenhuma chave carregada para este idioma. O fallback pt-BR será usado.
          </p>
        )}
        {!loading && entries.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-fg-muted">
                <th className="py-1 pr-4 font-medium">Chave</th>
                <th className="py-1 font-medium">Tradução</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <td className="py-1 pr-4 font-mono text-xs text-fg-muted">{k}</td>
                  <td className="py-1 text-fg">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
