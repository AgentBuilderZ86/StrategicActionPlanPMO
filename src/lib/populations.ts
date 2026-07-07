/**
 * Populations & adoption — logique pure : réceptivité, saturation et
 * playbooks de recommandation d'accompagnement. RGPD by design : ce module
 * ne manipule que des profils AGRÉGÉS de groupes, jamais d'individu.
 */

export const TRANCHES_AGE = ['MOINS_35', 'ENTRE_35_50', 'PLUS_50', 'MIXTE'] as const;
export type TrancheAge = (typeof TRANCHES_AGE)[number];

export const TRANCHE_AGE_LABEL: Record<TrancheAge, string> = {
  MOINS_35: 'Moins de 35 ans',
  ENTRE_35_50: '35 à 50 ans',
  PLUS_50: 'Plus de 50 ans',
  MIXTE: 'Mixte',
};

export const EXPOSITIONS = ['FAIBLE', 'MOYENNE', 'FORTE'] as const;
export type Exposition = (typeof EXPOSITIONS)[number];

export const NIVEAUX_IMPACT = ['INFORME', 'FORME', 'TRANSFORME'] as const;
export type NiveauImpact = (typeof NIVEAUX_IMPACT)[number];

export const NIVEAU_IMPACT_LABEL: Record<NiveauImpact, string> = {
  INFORME: 'Informé',
  FORME: 'Formé',
  TRANSFORME: 'Transformé',
};

/** Seuil de k-anonymat : aucun pulse restitué sous ce nombre de répondants. */
export const K_ANONYMAT = 8;
/** Saturation : au-delà de ce nombre de changements actifs simultanés. */
export const SEUIL_SATURATION = 5;

export type ProfilPopulation = {
  nom: string;
  effectif: number;
  trancheAge: string;
  ancienneteMoyenne: number | null;
  maturiteDigitale: number;
  expositionChangement: string;
};

export type PulseAgrege = {
  adhesion: number;
  comprehension: number;
  preparation: number;
  repondants: number;
};

export type ActionLiee = {
  titre: string;
  statut: string;
  niveauImpact: string;
  enDerive?: boolean;
};

/** Validation k-anonymat d'un pulse (règle métier, doublée côté zod). */
export function pulseValide(repondants: number): boolean {
  return repondants >= K_ANONYMAT;
}

export function chargeActive(actions: ActionLiee[]): number {
  return actions.filter((a) => a.statut !== 'TERMINE').length;
}

export function estSaturee(actions: ActionLiee[]): boolean {
  return chargeActive(actions) >= SEUIL_SATURATION;
}

/**
 * Réceptivité au changement (0-100) : composite explicable.
 * 40 % adhésion mesurée, 20 % préparation, 25 % maturité digitale,
 * 15 % charge de changement inversée. Sans pulse, l'adhésion et la
 * préparation sont neutralisées à 60.
 */
export function receptivite(
  profil: Pick<ProfilPopulation, 'maturiteDigitale'>,
  pulse: PulseAgrege | null,
  charge: number,
): number {
  const adhesion = pulse?.adhesion ?? 60;
  const preparation = pulse?.preparation ?? 60;
  const maturite = Math.min(5, Math.max(1, profil.maturiteDigitale)) * 20;
  const chargeInverse = Math.max(0, 100 - charge * 15);
  return Math.round(adhesion * 0.4 + preparation * 0.2 + maturite * 0.25 + chargeInverse * 0.15);
}

export type Recommandation = {
  code: 'SATURATION' | 'RELAIS_TERRAIN' | 'CO_CONSTRUCTION' | 'PREPARATION' | 'MICRO_LEARNING';
  titre: string;
  justification: string;
  actionSuggeree: { titre: string; description: string; priorite: 'HAUTE' | 'MOYENNE' };
};

/**
 * Playbooks contextualisés : croise le profil agrégé de la population,
 * le dernier pulse et l'état des actions liées. Règles VISIBLES et
 * éditables dans ce fichier — jamais de boîte noire. 3 recommandations max.
 */
export function recommander(
  profil: ProfilPopulation,
  pulse: PulseAgrege | null,
  actions: ActionLiee[],
): Recommandation[] {
  const recos: Recommandation[] = [];
  const charge = chargeActive(actions);
  const transformantes = actions.filter(
    (a) => a.statut !== 'TERMINE' && a.niveauImpact === 'TRANSFORME',
  );

  // 1. Saturation de changement — facteur d'échec majeur des plans multi-entités.
  if (charge >= SEUIL_SATURATION) {
    recos.push({
      code: 'SATURATION',
      titre: 'Proposer un rephasage au COPIL',
      justification: `« ${profil.nom} » subit ${charge} changements actifs simultanés (seuil : ${SEUIL_SATURATION}). Risque de rejet global.`,
      actionSuggeree: {
        titre: `Rephasage des actions ciblant ${profil.nom}`,
        description:
          'Prioriser les actions à plus fort enjeu, décaler les autres. Arbitrage à porter au COPIL.',
        priorite: 'HAUTE',
      },
    });
  }

  // 2. Faible maturité digitale + impact transformant : le e-learning seul échoue.
  if (profil.maturiteDigitale <= 2 && transformantes.length > 0) {
    recos.push({
      code: 'RELAIS_TERRAIN',
      titre: 'Relais de proximité et formation terrain',
      justification: `Maturité digitale ${profil.maturiteDigitale}/5 avec ${transformantes.length} action(s) transformante(s) : privilégier le présentiel, les pairs référents et les supports pas-à-pas.`,
      actionSuggeree: {
        titre: `Dispositif relais terrain — ${profil.nom}`,
        description:
          'Identifier des relais de proximité par site, organiser des sessions terrain, produire des supports pas-à-pas.',
        priorite: 'HAUTE',
      },
    });
  }

  // 3. Adhésion basse sur population expérimentée : co-construire, expliquer le pourquoi.
  if (pulse && pulse.adhesion < 50 && (profil.ancienneteMoyenne ?? 0) >= 10) {
    recos.push({
      code: 'CO_CONSTRUCTION',
      titre: 'Co-construction avec les experts métier',
      justification: `Adhésion ${pulse.adhesion} % sur une population de ${profil.ancienneteMoyenne} ans d'ancienneté moyenne : impliquer les anciens comme co-concepteurs, communiquer le « pourquoi ».`,
      actionSuggeree: {
        titre: `Ateliers de co-construction — ${profil.nom}`,
        description:
          'Ateliers avec les collaborateurs expérimentés, communication centrée sur le sens du changement.',
        priorite: 'HAUTE',
      },
    });
  }

  // 4. Sentiment de préparation insuffisant avant bascule.
  if (pulse && pulse.preparation < 50) {
    recos.push({
      code: 'PREPARATION',
      titre: "Renforcer l'accompagnement avant bascule",
      justification: `Sentiment de préparation à ${pulse.preparation} % : accompagnement de proximité à renforcer avant toute mise en production.`,
      actionSuggeree: {
        titre: `Renfort accompagnement — ${profil.nom}`,
        description: 'Permanences d’assistance, hotline dédiée, sessions de prise en main supplémentaires.',
        priorite: 'MOYENNE',
      },
    });
  }

  // 5. Population jeune et digitale, adhésion perfectible : formats courts.
  if (profil.maturiteDigitale >= 4 && profil.trancheAge === 'MOINS_35' && pulse && pulse.adhesion < 70) {
    recos.push({
      code: 'MICRO_LEARNING',
      titre: 'Micro-learning et ambassadeurs pairs',
      justification: `Population jeune et à l'aise avec le digital (${profil.maturiteDigitale}/5) mais adhésion à ${pulse.adhesion} % : formats courts et ambassadeurs pairs plus efficaces que la formation classique.`,
      actionSuggeree: {
        titre: `Programme ambassadeurs — ${profil.nom}`,
        description: 'Capsules micro-learning, communauté d’ambassadeurs pairs, challenges d’adoption.',
        priorite: 'MOYENNE',
      },
    });
  }

  return recos.slice(0, 3);
}
