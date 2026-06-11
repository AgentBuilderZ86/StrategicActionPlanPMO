export function KpiCard({
  label,
  value,
  sub,
  accent = '#16202E',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-title text-2xl font-extrabold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
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
