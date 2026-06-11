import { STATUTS, PRIORITE_RANG, type Statut } from './constants';
import { enRetard, moyenne } from './utils';

// Forme minimale d'action requise par les agrégations (pure, testable).
export type AggAction = {
  id: string;
  titre?: string;
  axeId: string;
  paysId: string;
  entiteId: string;
  axe?: string;
  pays?: string;
  entite?: string;
  responsable?: string;
  statut: string;
  priorite: string;
  avancement: number;
  budget?: number | null;
  budgetConso?: number | null;
  dateFin?: Date | string | null;
  commentaire?: string | null;
  enRetard?: boolean;
};

export type Kpis = {
  total: number;
  avancementMoyen: number;
  terminees: number;
  enCours: number;
  bloquees: number;
  enRetard: number;
  budgetTotal: number;
  budgetConso: number;
};

const isLate = (a: AggAction) => a.enRetard ?? enRetard(a.dateFin ?? null, a.statut);

export function computeKpis(actions: AggAction[]): Kpis {
  return {
    total: actions.length,
    avancementMoyen: Math.round(moyenne(actions.map((a) => a.avancement))),
    terminees: actions.filter((a) => a.statut === 'TERMINE').length,
    enCours: actions.filter((a) => a.statut === 'EN_COURS').length,
    bloquees: actions.filter((a) => a.statut === 'BLOQUE').length,
    enRetard: actions.filter(isLate).length,
    budgetTotal: actions.reduce((s, a) => s + (a.budget ?? 0), 0),
    budgetConso: actions.reduce((s, a) => s + (a.budgetConso ?? 0), 0),
  };
}

export type HeatCell = { axeId: string; axe: string; count: number; pct: number };
export type HeatRow = { paysId: string; pays: string; cells: HeatCell[]; total: number };

export function computeHeatmap(
  actions: AggAction[],
  pays: { id: string; nom: string }[],
  axes: { id: string; nom: string }[],
): HeatRow[] {
  return pays.map((p) => {
    const cells = axes.map((ax) => {
      const subset = actions.filter((a) => a.paysId === p.id && a.axeId === ax.id);
      return {
        axeId: ax.id,
        axe: ax.nom,
        count: subset.length,
        pct: Math.round(moyenne(subset.map((a) => a.avancement))),
      };
    });
    const total = actions.filter((a) => a.paysId === p.id).length;
    return { paysId: p.id, pays: p.nom, cells, total };
  });
}

export type DimAgg = {
  key: string;
  label: string;
  count: number;
  terminees: number;
  bloquees: number;
  enRetard: number;
  avancementMoyen: number;
  budget: number;
  budgetConso: number;
};

/** Agrégation générique par dimension (clé = id, label = nom lisible). */
export function aggregateByDimension(
  actions: AggAction[],
  keyOf: (a: AggAction) => string,
  labelOf: (a: AggAction) => string,
): DimAgg[] {
  const map = new Map<string, AggAction[]>();
  for (const a of actions) {
    const k = keyOf(a);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(a);
  }
  return [...map.entries()]
    .map(([key, items]) => ({
      key,
      label: labelOf(items[0]!),
      count: items.length,
      terminees: items.filter((a) => a.statut === 'TERMINE').length,
      bloquees: items.filter((a) => a.statut === 'BLOQUE').length,
      enRetard: items.filter(isLate).length,
      avancementMoyen: Math.round(moyenne(items.map((a) => a.avancement))),
      budget: items.reduce((s, a) => s + (a.budget ?? 0), 0),
      budgetConso: items.reduce((s, a) => s + (a.budgetConso ?? 0), 0),
    }))
    .sort((a, b) => b.count - a.count);
}

export function repartitionStatuts(actions: AggAction[]) {
  return STATUTS.map((s: Statut) => ({
    statut: s,
    count: actions.filter((a) => a.statut === s).length,
  })).filter((d) => d.count > 0);
}

export function pointsAttention(actions: AggAction[]): AggAction[] {
  return actions
    .filter((a) => a.statut === 'BLOQUE' || isLate(a))
    .map((a) => ({ ...a, enRetard: isLate(a) }))
    .sort((a, b) => {
      const pr = (PRIORITE_RANG[b.priorite as keyof typeof PRIORITE_RANG] ?? 0) -
        (PRIORITE_RANG[a.priorite as keyof typeof PRIORITE_RANG] ?? 0);
      if (pr !== 0) return pr;
      const fa = a.dateFin ? new Date(a.dateFin).getTime() : Infinity;
      const fb = b.dateFin ? new Date(b.dateFin).getTime() : Infinity;
      return fa - fb;
    });
}

export type TrendPoint = { periode: string; avancement: number };

/** Courbe de tendance : avancement global moyen par mois, à partir du dernier
 *  snapshot connu de chaque action jusqu'à la fin de chaque mois. */
export function computeTrend(
  snapshots: { actionId: string; date: Date | string; valeur: number }[],
): TrendPoint[] {
  if (snapshots.length === 0) return [];
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const months = [...new Set(sorted.map((s) => new Date(s.date).toISOString().slice(0, 7)))];
  const actionIds = [...new Set(sorted.map((s) => s.actionId))];

  return months.map((m) => {
    const cutoff = new Date(`${m}-01T00:00:00Z`);
    cutoff.setUTCMonth(cutoff.getUTCMonth() + 1); // fin de mois
    const latestPerAction = actionIds.map((id) => {
      const relevant = sorted.filter(
        (s) => s.actionId === id && new Date(s.date).getTime() < cutoff.getTime(),
      );
      return relevant.length ? relevant[relevant.length - 1]!.valeur : 0;
    });
    return { periode: m, avancement: Math.round(moyenne(latestPerAction)) };
  });
}
