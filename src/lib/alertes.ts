import type { FacteurRisque, NiveauRisque, RisqueAction } from './risque';

/**
 * Centre d'alertes — logique pure de rapprochement entre les risques calculés
 * et les alertes matérialisées en base. Fonctions sans accès base, testables ;
 * l'orchestration Prisma vit dans alertes-db.ts.
 */

export const ALERTE_STATUTS = ['NOUVELLE', 'PRISE_EN_CHARGE', 'RESOLUE', 'ACCEPTEE'] as const;
export type AlerteStatut = (typeof ALERTE_STATUTS)[number];

export const ALERTE_STATUT_LABEL: Record<AlerteStatut, string> = {
  NOUVELLE: 'Nouvelle',
  PRISE_EN_CHARGE: 'Prise en charge',
  RESOLUE: 'Résolue',
  ACCEPTEE: 'Risque accepté',
};

/** Seuil de création : une alerte naît quand le risque devient au moins ÉLEVÉ. */
export const SEUIL_ALERTE = 35;
/** Seuil de résorption : une alerte ouverte se résout d'elle-même sous ce score. */
export const SEUIL_RESORPTION = 15;
/** Une acceptation de risque est remise en cause si le score regagne 10 pts. */
export const MARGE_REACTIVATION = 10;

export const MOTIF_RESORPTION = 'Dérive résorbée (score repassé sous le seuil)';
export const MOTIF_REACTIVATION = 'Risque réévalué à la hausse après acceptation';

export type AlerteExistante = {
  id: string;
  actionId: string;
  statut: string;
  score: number;
};

export type AlerteACreer = {
  actionId: string;
  score: number;
  niveau: NiveauRisque;
  facteurs: FacteurRisque[];
  motif?: string;
};

export type SyncAlertes = {
  creer: AlerteACreer[];
  mettreAJour: { id: string; score: number; niveau: NiveauRisque; facteurs: FacteurRisque[] }[];
  resoudre: { id: string; motif: string }[];
};

const OUVERTES: readonly string[] = ['NOUVELLE', 'PRISE_EN_CHARGE'];

/**
 * Rapproche l'état calculé (risques du jour) de l'état matérialisé (alertes) :
 * crée les nouvelles dérives, met à jour les alertes ouvertes, résout
 * automatiquement les dérives résorbées. Une alerte ACCEPTEE ne renaît que si
 * le score dépasse l'acceptation de MARGE_REACTIVATION points. Idempotent.
 */
export function rapprocherAlertes(
  existantes: AlerteExistante[],
  risques: RisqueAction[],
): SyncAlertes {
  const parAction = new Map(risques.map((r) => [r.action.id, r]));
  const ouvertes = existantes.filter((a) => OUVERTES.includes(a.statut));
  const ouvertesParAction = new Map(ouvertes.map((a) => [a.actionId, a]));
  // Dernière acceptation par action (score au moment de l'acceptation).
  const accepteesParAction = new Map(
    existantes.filter((a) => a.statut === 'ACCEPTEE').map((a) => [a.actionId, a]),
  );

  const creer: SyncAlertes['creer'] = [];
  const mettreAJour: SyncAlertes['mettreAJour'] = [];
  const resoudre: SyncAlertes['resoudre'] = [];

  for (const r of risques) {
    const ouverte = ouvertesParAction.get(r.action.id);
    if (ouverte) {
      if (ouverte.score !== r.score) {
        mettreAJour.push({ id: ouverte.id, score: r.score, niveau: r.niveau, facteurs: r.facteurs });
      }
      continue;
    }
    if (r.score < SEUIL_ALERTE) continue;
    const acceptee = accepteesParAction.get(r.action.id);
    if (acceptee && r.score < acceptee.score + MARGE_REACTIVATION) continue;
    creer.push({
      actionId: r.action.id,
      score: r.score,
      niveau: r.niveau,
      facteurs: r.facteurs,
      motif: acceptee ? MOTIF_REACTIVATION : undefined,
    });
  }

  for (const a of ouvertes) {
    const r = parAction.get(a.actionId);
    if (!r || r.score < SEUIL_RESORPTION) {
      resoudre.push({ id: a.id, motif: MOTIF_RESORPTION });
    }
  }

  return { creer, mettreAJour, resoudre };
}

/** Transitions de statut autorisées (cycle de vie). */
export function transitionValide(de: string, vers: AlerteStatut): boolean {
  const autorisees: Record<string, AlerteStatut[]> = {
    NOUVELLE: ['PRISE_EN_CHARGE', 'RESOLUE', 'ACCEPTEE'],
    PRISE_EN_CHARGE: ['RESOLUE', 'ACCEPTEE', 'NOUVELLE'],
    RESOLUE: [],
    ACCEPTEE: ['NOUVELLE'],
  };
  return (autorisees[de] ?? []).includes(vers);
}

/** Digest : synthèse texte des alertes ouvertes, pour notification in-app. */
export function construireDigest(
  alertes: { score: number; niveau: string; statut: string; titre: string }[],
): { titre: string; message: string } | null {
  const ouvertes = alertes
    .filter((a) => OUVERTES.includes(a.statut))
    .sort((a, b) => b.score - a.score);
  if (ouvertes.length === 0) return null;
  const critiques = ouvertes.filter((a) => a.niveau === 'CRITIQUE').length;
  const top = ouvertes
    .slice(0, 5)
    .map((a) => `• [${a.score}] ${a.titre}`)
    .join('\n');
  return {
    titre: `Digest alertes : ${ouvertes.length} ouverte${ouvertes.length > 1 ? 's' : ''}${critiques ? ` dont ${critiques} critique${critiques > 1 ? 's' : ''}` : ''}`,
    message: top,
  };
}

/** Facteur dominant d'une alerte : celui qui pèse le plus dans le score. */
export function facteurPrincipal(facteurs: FacteurRisque[]): FacteurRisque | null {
  if (facteurs.length === 0) return null;
  return [...facteurs].sort((a, b) => b.points - a.points)[0]!;
}
