import type { AggAction } from './aggregations';
import { enRetard } from './utils';

/**
 * Moteur de risque explicable (V1.1) — détecte les dérives AVANT le retard.
 *
 * Chaque action reçoit un score 0–100 composé de facteurs pondérés et
 * lisibles : l'utilisateur voit toujours pourquoi une action est signalée,
 * jamais une boîte noire. Fonctions pures, sans accès base, testables.
 */

export type RisqueInput = AggAction & {
  dateDebut?: Date | string | null;
  updatedAt?: Date | string | null;
  confiance?: number | null;
};

export type FacteurCode = 'VELOCITE' | 'BUDGET' | 'DORMANTE' | 'BLOQUE' | 'SURCHARGE' | 'CONFIANCE';

export type FacteurRisque = {
  code: FacteurCode;
  label: string;
  detail: string;
  points: number;
};

export type NiveauRisque = 'CRITIQUE' | 'ELEVE' | 'MODERE' | 'FAIBLE';

export type RisqueAction = {
  action: RisqueInput;
  score: number;
  niveau: NiveauRisque;
  facteurs: FacteurRisque[];
};

export const NIVEAU_RISQUE_LABEL: Record<NiveauRisque, string> = {
  CRITIQUE: 'Critique',
  ELEVE: 'Élevé',
  MODERE: 'Modéré',
  FAIBLE: 'Faible',
};

export const NIVEAU_RISQUE_COLOR: Record<NiveauRisque, string> = {
  CRITIQUE: '#D64545',
  ELEVE: '#E8A13D',
  MODERE: '#2563EB',
  FAIBLE: '#64748B',
};

const toTime = (d: Date | string | null | undefined): number | null => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};

/** Avancement théorique à date : part du délai écoulé entre début et fin. */
export function avancementAttendu(a: RisqueInput, today: Date): number | null {
  if (a.statut === 'TERMINE') return null;
  const d0 = toTime(a.dateDebut);
  const d1 = toTime(a.dateFin ?? null);
  if (d0 === null || d1 === null || d1 <= d0) return null;
  const ratio = (today.getTime() - d0) / (d1 - d0);
  return Math.round(Math.min(100, Math.max(0, ratio * 100)));
}

export function niveauRisque(score: number): NiveauRisque {
  if (score >= 60) return 'CRITIQUE';
  if (score >= 35) return 'ELEVE';
  if (score >= 15) return 'MODERE';
  return 'FAIBLE';
}

/** Facteurs propres à une action (la surcharge, transverse, est ajoutée par computeRisques). */
export function facteursAction(a: RisqueInput, today: Date): FacteurRisque[] {
  const facteurs: FacteurRisque[] = [];
  if (a.statut === 'TERMINE') return facteurs;

  // 1. Dérive de vélocité (max 40) — signalée avant même le retard.
  const attendu = avancementAttendu(a, today);
  if (attendu !== null) {
    const ecart = attendu - a.avancement;
    if (ecart >= 10) {
      const retard = a.enRetard ?? enRetard(a.dateFin ?? null, a.statut);
      facteurs.push({
        code: 'VELOCITE',
        label: retard ? 'Retard avéré' : 'Dérive de vélocité',
        detail: `${a.avancement} % réalisé pour ${attendu} % du délai écoulé (écart −${ecart} pts)`,
        points: Math.min(40, Math.round(ecart * 0.5)),
      });
    }
  }

  // 2. Burn budgétaire décorrélé de l'avancement (max 25).
  if (a.budget && a.budget > 0 && a.budgetConso != null) {
    const burn = Math.round((a.budgetConso / a.budget) * 100);
    const ecart = burn - a.avancement;
    if (ecart >= 15) {
      facteurs.push({
        code: 'BUDGET',
        label: 'Burn budgétaire',
        detail: `${burn} % du budget consommé pour ${a.avancement} % d'avancement`,
        points: Math.min(25, Math.round((ecart - 15) * 0.5) + 5),
      });
    }
  }

  // 3. Action dormante : aucune mise à jour récente (max 20).
  const maj = toTime(a.updatedAt);
  if (maj !== null) {
    const semaines = Math.floor((today.getTime() - maj) / (7 * 86_400_000));
    if (semaines >= 2) {
      facteurs.push({
        code: 'DORMANTE',
        label: 'Action dormante',
        detail: `Aucune mise à jour depuis ${semaines} semaines`,
        points: Math.min(20, semaines * 5),
      });
    }
  }

  // 4. Signal humain : faible confiance déclarée au check-in (max 12).
  if (a.confiance != null && a.confiance <= 2) {
    facteurs.push({
      code: 'CONFIANCE',
      label: 'Confiance faible',
      detail: `Confiance déclarée au check-in : ${a.confiance}/5`,
      points: a.confiance === 1 ? 12 : 8,
    });
  }

  // 5. Blocage déclaré (15).
  if (a.statut === 'BLOQUE') {
    facteurs.push({
      code: 'BLOQUE',
      label: 'Action bloquée',
      detail: a.commentaire ? `Bloquée — ${a.commentaire}` : 'Statut bloqué déclaré',
      points: 15,
    });
  }

  return facteurs;
}

export const SEUIL_SURCHARGE = 5;

/**
 * Scores de risque du plan. Ajoute le facteur transverse de surcharge
 * (responsable portant trop d'actions actives) puis trie par score décroissant.
 * Ne remonte que les actions à risque au moins MODÉRÉ (score ≥ 15).
 */
export function computeRisques(actions: RisqueInput[], today: Date = new Date()): RisqueAction[] {
  const actives = actions.filter((a) => a.statut !== 'TERMINE');
  const parResponsable = new Map<string, number>();
  for (const a of actives) {
    const r = a.responsable?.trim();
    if (r) parResponsable.set(r, (parResponsable.get(r) ?? 0) + 1);
  }

  return actions
    .map((action) => {
      const facteurs = facteursAction(action, today);
      const r = action.responsable?.trim();
      const charge = r ? (parResponsable.get(r) ?? 0) : 0;
      if (facteurs.length > 0 && charge >= SEUIL_SURCHARGE) {
        facteurs.push({
          code: 'SURCHARGE',
          label: 'Responsable surchargé',
          detail: `${r} porte ${charge} actions actives`,
          points: 10,
        });
      }
      const score = Math.min(100, facteurs.reduce((s, f) => s + f.points, 0));
      return { action, score, niveau: niveauRisque(score), facteurs };
    })
    .filter((x) => x.score >= 15)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Insights de niveau plan — constats générés automatiquement, cliquables côté UI.
// ---------------------------------------------------------------------------

export type InsightPlan = {
  code: 'AXE_DERIVE' | 'CONCENTRATION' | 'SURCHARGE';
  message: string;
};

export function computeInsights(actions: RisqueInput[], today: Date = new Date()): InsightPlan[] {
  const insights: InsightPlan[] = [];
  const actives = actions.filter((a) => a.statut !== 'TERMINE');

  // 1. Axe en dérive : plus fort écart moyen attendu/réalisé (≥ 15 pts, ≥ 3 actions).
  const parAxe = new Map<string, { ecarts: number[] }>();
  for (const a of actives) {
    const attendu = avancementAttendu(a, today);
    if (attendu === null || !a.axe) continue;
    if (!parAxe.has(a.axe)) parAxe.set(a.axe, { ecarts: [] });
    parAxe.get(a.axe)!.ecarts.push(attendu - a.avancement);
  }
  let pire: { axe: string; ecart: number; n: number } | null = null;
  for (const [axe, { ecarts }] of parAxe) {
    if (ecarts.length < 3) continue;
    const moy = Math.round(ecarts.reduce((s, v) => s + v, 0) / ecarts.length);
    if (moy >= 15 && (!pire || moy > pire.ecart)) pire = { axe, ecart: moy, n: ecarts.length };
  }
  if (pire) {
    insights.push({
      code: 'AXE_DERIVE',
      message: `L'axe « ${pire.axe} » dérive : ${pire.ecart} pts d'écart moyen entre avancement théorique et réalisé sur ${pire.n} actions.`,
    });
  }

  // 2. Concentration des difficultés sur une entité (≥ 50 % des actions en difficulté, ≥ 3).
  const enDifficulte = actions.filter(
    (a) => a.statut === 'BLOQUE' || (a.enRetard ?? enRetard(a.dateFin ?? null, a.statut)),
  );
  if (enDifficulte.length >= 3) {
    const parEntite = new Map<string, number>();
    for (const a of enDifficulte) {
      if (a.entite) parEntite.set(a.entite, (parEntite.get(a.entite) ?? 0) + 1);
    }
    for (const [entite, n] of parEntite) {
      if (n / enDifficulte.length >= 0.5) {
        insights.push({
          code: 'CONCENTRATION',
          message: `${Math.round((n / enDifficulte.length) * 100)} % des actions en difficulté se concentrent sur « ${entite} » (${n}/${enDifficulte.length}). Un arbitrage ciblé résorberait l'essentiel de la dérive.`,
        });
        break;
      }
    }
  }

  // 3. Surcharge d'un responsable.
  const parResponsable = new Map<string, number>();
  for (const a of actives) {
    const r = a.responsable?.trim();
    if (r) parResponsable.set(r, (parResponsable.get(r) ?? 0) + 1);
  }
  const surcharges = [...parResponsable.entries()]
    .filter(([, n]) => n >= SEUIL_SURCHARGE)
    .sort((a, b) => b[1] - a[1]);
  if (surcharges.length > 0) {
    const [resp, n] = surcharges[0]!;
    insights.push({
      code: 'SURCHARGE',
      message: `${resp} porte ${n} actions actives. Une réaffectation partielle est recommandée.`,
    });
  }

  return insights;
}
