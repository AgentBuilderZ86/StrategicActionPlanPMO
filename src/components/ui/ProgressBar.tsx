import { fmtPct } from '@/lib/utils';

export function ProgressBar({ value, color = '#007CB8', showLabel = true }: { value: number; color?: string; showLabel?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500">{fmtPct(v)}</span>}
    </div>
  );
}
