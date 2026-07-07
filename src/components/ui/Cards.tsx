export function KpiCard({
  label,
  value,
  sub,
  accent = '#161D17',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  // Chaque KPI est une tuile colorée en dégradé ton sur ton (design v2).
  const TON: Record<string, string> = {
    '#0D8B50': 'tuile-emeraude',
    '#1A8A51': 'tuile-emeraude',
    '#BE7200': 'tuile-ambre',
    '#D33A3C': 'tuile-rouge',
    '#007CB8': 'tuile-bleu',
    '#161D17': 'tuile-sombre',
  };
  const ton = TON[accent.toUpperCase()] ?? 'tuile-vert';
  return (
    <div className={`tuile ${ton}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/70">{sub}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 ${className ?? ''}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-title text-sm font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
