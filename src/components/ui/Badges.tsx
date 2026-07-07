import {
  STATUT_LABEL,
  STATUT_COLOR,
  PRIORITE_LABEL,
  PRIORITE_COLOR,
  type Statut,
  type Priorite,
} from '@/lib/constants';

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function StatutBadge({ statut }: { statut: string }) {
  const s = statut as Statut;
  const color = STATUT_COLOR[s] ?? '#586059';
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: hexToRgba(color, 0.12), color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUT_LABEL[s] ?? statut}
    </span>
  );
}

export function PrioriteBadge({ priorite }: { priorite: string }) {
  const p = priorite as Priorite;
  const color = PRIORITE_COLOR[p] ?? '#586059';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {PRIORITE_LABEL[p] ?? priorite}
    </span>
  );
}

export function RetardBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-statut-rouge/10 px-2 py-0.5 text-[11px] font-bold text-statut-rouge">
      ⏰ En retard
    </span>
  );
}
