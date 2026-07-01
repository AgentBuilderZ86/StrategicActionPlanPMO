// Énumérations applicatives (SQLite ne supporte pas les enum Prisma natifs)
// et tokens de design partagés entre composants.
// Adapté pour la NARSA — Agence Nationale de la Sécurité Routière (Maroc)

export const STATUTS = ['A_LANCER', 'EN_COURS', 'TERMINE', 'BLOQUE'] as const;
export type Statut = (typeof STATUTS)[number];

export const PRIORITES = ['HAUTE', 'MOYENNE', 'BASSE'] as const;
export type Priorite = (typeof PRIORITES)[number];

export const ROLES = ['ADMIN', 'PMO', 'CONTRIBUTEUR', 'LECTEUR'] as const;
export type Role = (typeof ROLES)[number];

// Types de module PMO (3 volets NARSA selon le CPS)
export const PMO_TYPES = ['ECOSYSTEME', 'INTERNE', 'SI'] as const;
export type PmoType = (typeof PMO_TYPES)[number];

export const STATUT_LABEL: Record<Statut, string> = {
  A_LANCER: 'À lancer',
  EN_COURS: 'En cours',
  TERMINE: 'Réalisé',
  BLOQUE: 'Bloqué',
};

export const STATUT_COLOR: Record<Statut, string> = {
  A_LANCER: '#64748B', // gris
  EN_COURS: '#006B3F', // vert NARSA
  TERMINE: '#1B9E62', // vert clair
  BLOQUE: '#D64545', // rouge
};

export const PRIORITE_LABEL: Record<Priorite, string> = {
  HAUTE: 'Haute',
  MOYENNE: 'Moyenne',
  BASSE: 'Basse',
};

export const PRIORITE_COLOR: Record<Priorite, string> = {
  HAUTE: '#D64545',
  MOYENNE: '#E8A13D',
  BASSE: '#64748B',
};

export const PRIORITE_RANG: Record<Priorite, number> = {
  HAUTE: 3,
  MOYENNE: 2,
  BASSE: 1,
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrateur',
  PMO: 'Chargé PMO',
  CONTRIBUTEUR: 'Contributeur',
  LECTEUR: 'Observateur',
};

export const PMO_TYPE_LABEL: Record<PmoType, string> = {
  ECOSYSTEME: 'PMO Écosystème (SNSR)',
  INTERNE: 'PMO Interne (NARSA)',
  SI: 'PMO SI (Projets IT)',
};

export const PMO_TYPE_DESCRIPTION: Record<PmoType, string> = {
  ECOSYSTEME:
    'Suivi des actions et engagements de la stratégie nationale de la sécurité routière avec les partenaires institutionnels.',
  INTERNE:
    "Suivi du plan d'action annuel interne de la NARSA et de ses chantiers thématiques.",
  SI: "Pilotage des projets IT en cohérence avec la feuille de route digitale de l'Agence.",
};

// Niveaux hiérarchiques du plan d'action (5 niveaux NARSA selon le CPS)
export const NIVEAUX = [1, 2, 3, 4, 5] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const NIVEAU_LABEL: Record<Niveau, string> = {
  1: 'Pilier Stratégique (PS)',
  2: 'Axe Stratégique (CS)',
  3: 'Projet Structurant (PS)',
  4: 'Action Principale (AP)',
  5: 'Sous-Action (SA)',
};

export const NIVEAU_CODE_PREFIX: Record<Niveau, string> = {
  1: 'PS',
  2: 'CS',
  3: 'PRJ',
  4: 'AP',
  5: 'SA',
};

// Profondeur maximale de l'arbre. Le CPS exige de pouvoir descendre au-delà
// de 5 niveaux : borne configurable plutôt que plafond dur à 5.
export const NIVEAU_MAX = 8;

/** Libellé d'un niveau, avec repli générique au-delà des 5 niveaux nommés. */
export function niveauLabel(n: number): string {
  return NIVEAU_LABEL[n as Niveau] ?? `Niveau ${n}`;
}

/** Préfixe de codification d'un niveau, avec repli `N<n>` au-delà de 5. */
export function niveauPrefix(n: number): string {
  return NIVEAU_CODE_PREFIX[n as Niveau] ?? `N${n}`;
}

/** Droit d'écriture côté client (le lecteur est en lecture seule). */
export function canEditClient(role: Role | undefined): boolean {
  return role === 'ADMIN' || role === 'PMO' || role === 'CONTRIBUTEUR';
}

// Palette « statut » pour la heatmap (rouge → ambre → vert)
export const COLORS = {
  canvas: '#F4F6F5',
  ink: '#0D2818',
  accent: '#006B3F',
  vert: '#1B9E62',
  ambre: '#E8A13D',
  rouge: '#D64545',
  gris: '#64748B',
};

// Monnaie — Maroc : MAD (Dirham marocain), exprimé en milliers
export const CURRENCY = 'k MAD';

// Objectif SNSR 2030 : réduction de 50% de la mortalité
export const SNSR_OBJECTIF = {
  mortalite2024: 4024,
  mortalite_bg2024: 14718,
  cibleMortalite2030: 2000,
  cibleBg2030: 7300,
  reductionCible: 50, // %
};

// Types d'attributs personnalisables (T1.1)
export const ATTRIBUT_TYPES = ['TEXTE', 'NOMBRE', 'DATE', 'BOOLEEN', 'LISTE'] as const;
export type AttributType = (typeof ATTRIBUT_TYPES)[number];

export const ATTRIBUT_TYPE_LABEL: Record<AttributType, string> = {
  TEXTE: 'Texte',
  NOMBRE: 'Nombre',
  DATE: 'Date',
  BOOLEEN: 'Oui / Non',
  LISTE: 'Liste de choix',
};

// Sens d'amélioration d'un indicateur (T1.2)
export const SENS_INDICATEUR = ['HAUSSE', 'BAISSE'] as const;
export type SensIndicateur = (typeof SENS_INDICATEUR)[number];

export const SENS_LABEL: Record<SensIndicateur, string> = {
  HAUSSE: 'À la hausse (plus = mieux)',
  BAISSE: 'À la baisse (moins = mieux)',
};

export const DIMENSIONS = [
  { key: 'pays', label: 'Région' },
  { key: 'entite', label: 'Pôle / Partenaire' },
  { key: 'axe', label: 'Pilier stratégique' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'priorite', label: 'Priorité' },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]['key'];
