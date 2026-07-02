// Calculs de planification visuelle (Gantt) — purs et testables (T2.1, exig. 16).

export type GanttItem = {
  id: string;
  titre: string;
  code?: string | null;
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
  statut: string;
  avancement: number;
  niveau: number;
};

export type GanttBar = {
  id: string;
  titre: string;
  code: string | null;
  statut: string;
  avancement: number;
  niveau: number;
  offsetPct: number;
  widthPct: number;
  sansDates: boolean;
};

export type MoisTick = { label: string; offsetPct: number };

export type GanttLayout = {
  min: Date;
  max: Date;
  bars: GanttBar[];
  mois: MoisTick[];
  todayPct: number | null;
};

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const MOIS_COURTS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

/**
 * Construit la mise en page d'un Gantt à partir d'actions datées. Les positions
 * sont exprimées en pourcentage de la plage temporelle globale (pour un rendu
 * responsive sans dépendance externe). Renvoie null si aucune date exploitable.
 */
export function calculerGantt(items: GanttItem[], today: Date = new Date()): GanttLayout | null {
  const dates: number[] = [];
  for (const it of items) {
    const d = toDate(it.dateDebut);
    const f = toDate(it.dateFin);
    if (d) dates.push(d.getTime());
    if (f) dates.push(f.getTime());
  }
  if (dates.length === 0) return null;

  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  // Évite une plage nulle (toutes les dates identiques).
  if (max.getTime() === min.getTime()) max.setDate(max.getDate() + 1);
  const span = max.getTime() - min.getTime();
  const pct = (t: number) => ((t - min.getTime()) / span) * 100;

  const bars: GanttBar[] = items.map((it) => {
    let d = toDate(it.dateDebut);
    let f = toDate(it.dateFin);
    const sansDates = !d && !f;
    // Si une seule borne existe, on l'étend d'un jalon d'un jour pour la visibilité.
    if (d && !f) f = new Date(d.getTime() + 86_400_000);
    if (!d && f) d = new Date(f.getTime() - 86_400_000);
    const offsetPct = d ? Math.max(0, pct(d.getTime())) : 0;
    const finPct = f ? Math.min(100, pct(f.getTime())) : offsetPct;
    return {
      id: it.id,
      titre: it.titre,
      code: it.code ?? null,
      statut: it.statut,
      avancement: it.avancement,
      niveau: it.niveau,
      offsetPct,
      widthPct: Math.max(0.5, finPct - offsetPct),
      sansDates,
    };
  });

  // Repères mensuels (début de chaque mois dans la plage).
  const mois: MoisTick[] = [];
  const curseur = new Date(min.getFullYear(), min.getMonth(), 1);
  while (curseur.getTime() <= max.getTime()) {
    const t = curseur.getTime();
    if (t >= min.getTime()) {
      mois.push({ label: `${MOIS_COURTS[curseur.getMonth()]} ${String(curseur.getFullYear()).slice(2)}`, offsetPct: pct(t) });
    }
    curseur.setMonth(curseur.getMonth() + 1);
  }

  const tj = today.getTime();
  const todayPct = tj >= min.getTime() && tj <= max.getTime() ? pct(tj) : null;

  return { min, max, bars, mois, todayPct };
}
