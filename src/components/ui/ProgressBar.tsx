import { fmtPct } from '@/lib/utils';

export function ProgressBar({
  value,
  color = 'var(--brand)',
  showLabel = true,
}: {
  value: number;
  color?: string;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--bg)' }}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="num w-10 shrink-0 text-right text-[11.5px] font-semibold text-muted">{fmtPct(v)}</span>}
    </div>
  );
}
