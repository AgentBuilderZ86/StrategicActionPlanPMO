// Énumérations applicatives (SQLite ne supporte pas les enum Prisma natifs)
// et tokens de design partagés entre composants.

export const STATUTS = ['A_LANCER', 'EN_COURS', 'TERMINE', 'BLOQUE'] as const;
export type Statut = (typeof STATUTS)[number];

export const PRIORITES = ['HAUTE', 'MOYENNE', 'BASSE'] as const;
export type Priorite = (typeof PRIORITES)[number];

export const ROLES = ['ADMIN', 'PMO', 'CONTRIBUTEUR', 'LECTEUR'] as const;
export type Role = (typeof ROLES)[number];

export const STATUT_LABEL: Record<Statut, string> = {
  A_LANCER: 'À lancer',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  BLOQUE: 'Bloqué',
};

export const STATUT_COLOR: Record<Statut, string> = {
  A_LANCER: '#64748B', // gris
  EN_COURS: '#1E4FD8', // accent
  TERMINE: '#1B9E62', // vert
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
  PMO: 'PMO',
  CONTRIBUTEUR: 'Contributeur',
  LECTEUR: 'Lecteur',
};

// Palette « statut » pour la heatmap (rouge → ambre → vert)
export const COLORS = {
  canvas: '#F4F5F7',
  ink: '#16202E',
  accent: '#1E4FD8',
  vert: '#1B9E62',
  ambre: '#E8A13D',
  rouge: '#D64545',
  gris: '#64748B',
};

export const CURRENCY = 'k€';

export const DIMENSIONS = [
  { key: 'pays', label: 'Pays' },
  { key: 'entite', label: 'Entité' },
  { key: 'axe', label: 'Axe' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'priorite', label: 'Priorité' },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]['key'];
