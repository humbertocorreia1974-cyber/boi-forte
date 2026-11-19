'use client';

type Ponto = {
  idadeMeses: number;
  pesoKg: number;
  metaKg: number;
  data: string;
};

export function CurvaChart({ pontos }: { pontos: Ponto[] }) {
  const maxIdade = Math.max(...pontos.map((p) => p.idadeMeses), 24);
  const maxPeso = Math.max(...pontos.map((p) => Math.max(p.pesoKg, p.metaKg)), 100);

  const w = 720;
  const h = 320;
  const pad = 40;
  const x = (m: number) => pad + (m / maxIdade) * (w - pad * 2);
  const y = (kg: number) => h - pad - (kg / maxPeso) * (h - pad * 2);

  const pathReal = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.idadeMeses)} ${y(p.pesoKg)}`)
    .join(' ');
  const pathMeta = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.idadeMeses)} ${y(p.metaKg)}`)
    .join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-80 w-full min-w-[600px]">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" className="text-border" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" className="text-border" />
        <path d={pathMeta} fill="none" stroke="currentColor" className="text-fg-muted" strokeDasharray="6 4" strokeWidth={2} />
        <path d={pathReal} fill="none" stroke="currentColor" className="text-brand" strokeWidth={2.5} />
        {pontos.map((p, i) => (
          <circle key={i} cx={x(p.idadeMeses)} cy={y(p.pesoKg)} r={3.5} className="fill-brand" />
        ))}
        <text x={w / 2} y={h - 8} textAnchor="middle" className="fill-current text-xs text-fg-muted">
          Idade (meses)
        </text>
        <text x={12} y={h / 2} textAnchor="middle` transform={`rotate(-90 12 ${h / 2})`} className=`fill-current text-xs text-fg-muted">
          Peso (kg)
        </text>
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-brand" /> Peso real
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-fg-muted" /> Meta da raça
        </span>
      </div>
    </div>
  );
}
