import type { ActionDTO } from './serialize';
import { computeRisques, type RisqueAction } from './risque';
import { enRetard } from './utils';

/**
 * « Ma journée » — sélections pures pour la vue personnalisée par rôle.
 * Le contributeur voit SES actions (responsable et/ou périmètre pays),
 * le PMO/ADMIN voit les risques du plan et les validations en attente.
 * Fonctions pures et testables, sans accès base.
 */

export type ActionJour = ActionDTO;

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Actions « à moi » : responsable correspondant au nom de session, sinon
 *  restriction au périmètre pays du contributeur. */
export function mesActions(
  actions: ActionJour[],
  user: { name?: string | null; perimetrePays?: string[] | null },
): ActionJour[] {
  const nom = user.name ? normalise(user.name) : null;
  const parNom = nom
    ? actions.filter((a) => a.responsable && normalise(a.responsable).includes(nom))
    : [];
  if (parNom.length > 0) return parNom;
  if (user.perimetrePays && user.perimetrePays.length > 0) {
    return actions.filter((a) => a.paysId && user.perimetrePays!.includes(a.paysId));
  }
  return [];
}

/** Actions actives arrivant à échéance sous `jours` jours (ou déjà en retard). */
export function echeancesProches(actions: ActionJour[], jours: number, today: Date = new Date()): ActionJour[] {
  const limite = today.getTime() + jours * 86_400_000;
  return actions
    .filter((a) => a.statut !== 'TERMINE' && a.dateFin)
    .filter((a) => new Date(a.dateFin!).getTime() <= limite)
    .sort((a, b) => new Date(a.dateFin!).getTime() - new Date(b.dateFin!).getTime());
}

/** File du check-in hebdomadaire : les actions actives « à moi », les plus
 *  risquées d'abord pour maximiser la valeur des premières minutes. */
export function fileCheckin(
  actions: ActionJour[],
  user: { name?: string | null; perimetrePays?: string[] | null },
  today: Date = new Date(),
): ActionJour[] {
  const miennes = mesActions(actions, user).filter((a) => a.statut !== 'TERMINE');
  const risques = computeRisques(miennes, today);
  const scoreParId = new Map(risques.map((r) => [r.action.id, r.score]));
  return [...miennes].sort((a, b) => (scoreParId.get(b.id) ?? 0) - (scoreParId.get(a.id) ?? 0));
}

export type MaJournee = {
  mesActions: ActionJour[];
  mesEcheances: ActionJour[];
  mesRetards: number;
  fileCheckin: ActionJour[];
  risquesPlan: RisqueAction[];
};

/** Assemble la vue à partir des actions du plan (déjà sérialisées). */
export function computeMaJournee(
  actions: ActionJour[],
  user: { name?: string | null; perimetrePays?: string[] | null; role: string },
  today: Date = new Date(),
): MaJournee {
  const miennes = mesActions(actions, user);
  const actives = miennes.filter((a) => a.statut !== 'TERMINE');
  const pilotage = user.role === 'ADMIN' || user.role === 'PMO';
  return {
    mesActions: actives,
    mesEcheances: echeancesProches(miennes, 14, today),
    mesRetards: miennes.filter((a) => a.enRetard ?? enRetard(a.dateFin ?? null, a.statut)).length,
    fileCheckin: fileCheckin(actions, user, today),
    risquesPlan: pilotage ? computeRisques(actions, today).slice(0, 8) : [],
  };
}
