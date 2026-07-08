import {
  STATUT_LABEL,
  STATUT_COLOR,
  STATUT_BG,
  PRIORITE_LABEL,
  PRIORITE_COLOR,
  type Statut,
  type Priorite,
} from '@/lib/constants';

export function StatutBadge({ statut }: { statut: string }) {
  const s = statut as Statut;
  const color = STATUT_COLOR[s] ?? 'oklch(48% 0.015 150)';
  const bg = STATUT_BG[s] ?? 'oklch(94% 0.005 150)';
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-[5px] pl-2 pr-2.5 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUT_LABEL[s] ?? statut}
    </span>
  );
}

export function PrioriteBadge({ priorite }: { priorite: string }) {
  const p = priorite as Priorite;
  const color = PRIORITE_COLOR[p] ?? 'oklch(48% 0.015 150)';
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l9 16H3z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
      {PRIORITE_LABEL[p] ?? priorite}
    </span>
  );
}

export function RetardBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      En retard
    </span>
  );
}
