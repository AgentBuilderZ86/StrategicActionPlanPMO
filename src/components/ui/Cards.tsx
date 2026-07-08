export function KpiCard({
  label,
  value,
  sub,
  accent = 'var(--text)',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">{label}</div>
      <div className="num mt-2 text-[23px] font-semibold" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
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
          <h3 className="text-[14.5px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
