import { CURRENCY, niveauPrefix, type Statut } from './constants';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Règle dérivée : en retard si échéance dépassée et action non terminée. */
export function enRetard(dateFin: Date | string | null | undefined, statut: string): boolean {
  if (!dateFin) return false;
  if (statut === 'TERMINE') return false;
  const fin = typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
  if (Number.isNaN(fin.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return fin.getTime() < today.getTime();
}

export function fmtMoney(n: number | null | undefined): string {
  return `${Number(n ?? 0).toLocaleString('fr-FR')} ${CURRENCY}`;
}

export function fmtPct(n: number | null | undefined): string {
  return `${Math.round(n ?? 0)} %`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function moyenne(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Couleur heatmap : 0 % rouge → 50 % ambre → 100 % vert. */
export function heatColor(pct: number, count: number): { bg: string; fg: string } {
  if (count === 0) return { bg: '#F1F3F5', fg: '#B6Bec9' };
  const t = Math.max(0, Math.min(100, pct)) / 100;
  // rouge (214,69,69) → ambre (232,161,61) → vert (27,158,98)
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const k = t / 0.5;
    r = Math.round(214 + (232 - 214) * k);
    g = Math.round(69 + (161 - 69) * k);
    b = Math.round(69 + (61 - 69) * k);
  } else {
    const k = (t - 0.5) / 0.5;
    r = Math.round(232 + (27 - 232) * k);
    g = Math.round(161 + (158 - 161) * k);
    b = Math.round(61 + (98 - 61) * k);
  }
  return { bg: `rgb(${r},${g},${b})`, fg: '#FFFFFF' };
}

export const STATUT_FROM_AVANCEMENT = (av: number): Statut =>
  av >= 100 ? 'TERMINE' : av > 0 ? 'EN_COURS' : 'A_LANCER';

/** Segment de code d'un nœud : préfixe de niveau + position (1-based) dans la fratrie. */
export function segmentCode(niveau: number, position: number): string {
  return `${niveauPrefix(niveau)}${position}`;
}

/**
 * Code complet d'un nœud, cohérent avec l'arbre (ex. `PS1.CS2.PRJ1`).
 * @param segmentsAncetres codes-segments des ancêtres, du plus haut au parent direct
 * @param niveau niveau du nœud
 * @param position position 1-based du nœud dans sa fratrie
 */
export function genererCode(segmentsAncetres: string[], niveau: number, position: number): string {
  return [...segmentsAncetres, segmentCode(niveau, position)].join('.');
}
