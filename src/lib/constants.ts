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

/**
 * Navigation adaptative : chaque entrée précise les types de plan pour
 * lesquels elle est pertinente. Un plan SI n'a par exemple pas vocation à
 * afficher un onglet « Comité de pilotage », et seul un plan SI affiche
 * « Agile / SI ». Filtré par `Nav` selon le plan actif.
 */
export const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: '📊', modules: PMO_TYPES },
  { href: '/actions', label: "Plan d'actions", icon: '🗂️', modules: PMO_TYPES },
  { href: '/planning', label: 'Planning', icon: '🗓️', modules: PMO_TYPES },
  { href: '/agile', label: 'Agile / SI', icon: '🧩', modules: ['SI'] as PmoType[] },
  { href: '/analyses', label: 'Analyses', icon: '📈', modules: PMO_TYPES },
  { href: '/rapports', label: 'Rapports', icon: '📄', modules: PMO_TYPES },
  { href: '/copil', label: 'Comité de pilotage', icon: '🎯', modules: ['ECOSYSTEME', 'INTERNE'] as PmoType[] },
  { href: '/parametres', label: 'Paramètres', icon: '⚙️', modules: PMO_TYPES },
] as const;

/** Style visuel (badge, carte) par type de PMO — partagé par PlanBanner,
 *  PortfolioCard et PlanSwitcher. */
export const PMO_TYPE_BADGE: Record<PmoType, { bg: string; fg: string; icon: string }> = {
  ECOSYSTEME: { bg: 'rgba(27,158,98,0.12)', fg: '#1B9E62', icon: '🛣️' },
  INTERNE: { bg: 'rgba(0,107,63,0.12)', fg: '#006B3F', icon: '🏛️' },
  SI: { bg: 'rgba(30,79,216,0.12)', fg: '#1E4FD8', icon: '💻' },
};

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

// ── Habilitations fines (T1.6, exig. 30, 31) ────────────────────────────────
export const DROITS = ['lecture', 'saisie', 'validation', 'reporting'] as const;
export type Droit = (typeof DROITS)[number];
export type Droits = Record<Droit, boolean>;

export const DROIT_LABEL: Record<Droit, string> = {
  lecture: 'Lecture',
  saisie: 'Saisie',
  validation: 'Validation',
  reporting: 'Reporting',
};

export const TYPES_UTILISATEUR = ['INTERNE', 'PARTENAIRE_EXTERNE'] as const;
export type TypeUtilisateur = (typeof TYPES_UTILISATEUR)[number];

export const TYPE_UTILISATEUR_LABEL: Record<TypeUtilisateur, string> = {
  INTERNE: 'Interne NARSA',
  PARTENAIRE_EXTERNE: 'Partenaire externe',
};

/** Droits par défaut dérivés du rôle (utilisés quand aucun droit fin n'est défini). */
export function droitsParDefaut(role: Role): Droits {
  switch (role) {
    case 'ADMIN':
    case 'PMO':
      return { lecture: true, saisie: true, validation: true, reporting: true };
    case 'CONTRIBUTEUR':
      return { lecture: true, saisie: true, validation: false, reporting: false };
    default:
      return { lecture: true, saisie: false, validation: false, reporting: false };
  }
}

/** Résout les droits effectifs : droits fins s'ils existent, sinon dérivés du rôle. */
export function droitsEffectifs(role: Role, droits: Droits | null | undefined): Droits {
  return droits ?? droitsParDefaut(role);
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

// Volet Agile (T2.3, exig. 19, 20, 21)
export const SPRINT_STATUTS = ['PLANIFIE', 'EN_COURS', 'CLOS'] as const;
export type SprintStatut = (typeof SPRINT_STATUTS)[number];
export const SPRINT_STATUT_LABEL: Record<SprintStatut, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  CLOS: 'Clôturé',
};

export const KANBAN_COLONNES = ['BACKLOG', 'A_FAIRE', 'EN_COURS', 'EN_REVUE', 'TERMINE'] as const;
export type KanbanColonne = (typeof KANBAN_COLONNES)[number];
export const KANBAN_LABEL: Record<KanbanColonne, string> = {
  BACKLOG: 'Backlog',
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  EN_REVUE: 'En revue',
  TERMINE: 'Terminé',
};

// Widgets du tableau de bord personnalisable (T2.2, exig. 23)
export const DASHBOARD_WIDGETS = [
  { key: 'insights', label: 'Insights automatiques' },
  { key: 'risques', label: 'Alertes proactives (moteur de risque)' },
  { key: 'heatmap', label: 'Carte de chaleur (région × axe)' },
  { key: 'parAxe', label: 'Avancement par axe' },
  { key: 'statuts', label: 'Répartition par statut' },
  { key: 'parPays', label: 'Avancement par région' },
  { key: 'budget', label: 'Budget par axe' },
  { key: 'tendance', label: 'Tendance d’avancement' },
  { key: 'attention', label: 'Points d’attention' },
] as const;

export type WidgetKey = (typeof DASHBOARD_WIDGETS)[number]['key'];

export type WidgetConfig = { key: WidgetKey; visible: boolean };

/** Configuration par défaut : tous les widgets visibles, dans l'ordre canonique. */
export function dashboardConfigParDefaut(): WidgetConfig[] {
  return DASHBOARD_WIDGETS.map((w) => ({ key: w.key, visible: true }));
}

// Validation hiérarchique (T1.5)
export const VALIDATION_STATUTS = ['EN_ATTENTE', 'APPROUVE', 'REJETE'] as const;
export type ValidationStatut = (typeof VALIDATION_STATUTS)[number];

export const VALIDATION_LABEL: Record<ValidationStatut, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
};

/** Rôle validateur attendu selon le niveau (validation hiérarchique, exig. 25).
 *  Les nœuds hauts (Pilier/Axe) sont validés par un ADMIN, les autres par le PMO. */
export function roleValidateurPourNiveau(niveau: number): Role {
  return niveau <= 2 ? 'ADMIN' : 'PMO';
}

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
