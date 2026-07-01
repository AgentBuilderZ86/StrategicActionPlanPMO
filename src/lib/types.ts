// Types partagés côté client (sans dépendance Prisma runtime)

export type ActionDTO = {
  id: string;
  titre: string;
  description: string | null;
  planId: string;
  axeId: string | null;
  paysId: string | null;
  entiteId: string | null;
  parentId: string | null;
  ordre: number;
  axe: string | null;
  pays: string | null;
  entite: string | null;
  responsable: string;
  statut: string;
  avancement: number;
  priorite: string;
  dateDebut: string | null;
  dateFin: string | null;
  budget: number | null;
  budgetConso: number | null;
  commentaire: string | null;
  enRetard: boolean;
  niveau: number;
  indicateur: string | null;
  cibleIndicateur: number | null;
  valeurIndicateur: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Referentiels = {
  axes: { id: string; nom: string; ordre: number }[];
  pays: { id: string; nom: string; code: string | null }[];
  entites: { id: string; nom: string; paysId: string | null }[];
};

export type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
