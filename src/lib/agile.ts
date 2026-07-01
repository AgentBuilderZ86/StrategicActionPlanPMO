// Métriques agiles (T2.3, exig. 20) — pures et testables.
import { KANBAN_COLONNES, type KanbanColonne } from './constants';

export type ItemAgile = {
  id: string;
  sprintId?: string | null;
  statut: string;
  points?: number | null;
};

export type SprintAgile = {
  id: string;
  nom: string;
  statut: string;
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
};

const pts = (i: ItemAgile) => i.points ?? 0;
const estTermine = (i: ItemAgile) => i.statut === 'TERMINE';

/** Velocity : points terminés par sprint (exig. 20). */
export function computeVelocity(
  sprints: SprintAgile[],
  items: ItemAgile[],
): { sprint: string; points: number }[] {
  return sprints.map((s) => ({
    sprint: s.nom,
    points: items.filter((i) => i.sprintId === s.id && estTermine(i)).reduce((sum, i) => sum + pts(i), 0),
  }));
}

/** Cumulative Flow Diagram : nombre d'items par colonne Kanban (instantané). */
export function computeCFD(items: ItemAgile[]): { colonne: KanbanColonne; count: number }[] {
  return KANBAN_COLONNES.map((c) => ({
    colonne: c,
    count: items.filter((i) => i.statut === c).length,
  }));
}

export type BurndownPoint = { jour: number; ideal: number; restant: number | null };

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Burndown d'un sprint (exig. 20). Ligne idéale = descente linéaire du total de
 * points vers 0 sur la durée du sprint. La ligne « restant » n'est renseignée que
 * jusqu'à aujourd'hui (à défaut d'historique quotidien, elle décroît au prorata
 * des points terminés — approximation documentée).
 */
export function computeBurndown(
  sprint: SprintAgile,
  items: ItemAgile[],
  today: Date = new Date(),
): BurndownPoint[] {
  const debut = toDate(sprint.dateDebut);
  const fin = toDate(sprint.dateFin);
  const duSprint = items.filter((i) => i.sprintId === sprint.id);
  const total = duSprint.reduce((s, i) => s + pts(i), 0);
  const termines = duSprint.filter(estTermine).reduce((s, i) => s + pts(i), 0);
  if (!debut || !fin || fin.getTime() <= debut.getTime() || total === 0) return [];

  const jours = Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86_400_000));
  const jourActuel = Math.round((today.getTime() - debut.getTime()) / 86_400_000);

  const points: BurndownPoint[] = [];
  for (let j = 0; j <= jours; j++) {
    const ideal = Math.max(0, total - (total * j) / jours);
    // Restant approximé : linéaire du total vers (total - termines) jusqu'à aujourd'hui.
    let restant: number | null = null;
    if (j <= Math.min(jourActuel, jours) && jourActuel >= 0) {
      const ratio = jourActuel > 0 ? Math.min(1, j / jourActuel) : 0;
      restant = Math.max(0, total - termines * ratio);
    }
    points.push({ jour: j, ideal: Math.round(ideal), restant: restant == null ? null : Math.round(restant) });
  }
  return points;
}
