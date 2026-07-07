export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-title text-xl font-extrabold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
