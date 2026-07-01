import type { Prisma } from '@prisma/client';
import { enRetard } from './utils';

export type ActionWithRelations = Prisma.ActionGetPayload<{
  include: { axe: true; pays: true; entite: true };
}>;

export type ActionDTO = ReturnType<typeof serializeAction>;

export function serializeAction(a: ActionWithRelations) {
  return {
    id: a.id,
    titre: a.titre,
    description: a.description,
    planId: a.planId,
    axeId: a.axeId,
    paysId: a.paysId,
    entiteId: a.entiteId,
    parentId: a.parentId,
    ordre: a.ordre,
    axe: a.axe?.nom ?? null,
    pays: a.pays?.nom ?? null,
    entite: a.entite?.nom ?? null,
    responsable: a.responsable,
    statut: a.statut,
    avancement: a.avancement,
    priorite: a.priorite,
    dateDebut: a.dateDebut ? a.dateDebut.toISOString() : null,
    dateFin: a.dateFin ? a.dateFin.toISOString() : null,
    budget: a.budget,
    budgetConso: a.budgetConso,
    commentaire: a.commentaire,
    enRetard: enRetard(a.dateFin, a.statut),
    niveau: a.niveau,
    indicateur: a.indicateur,
    cibleIndicateur: a.cibleIndicateur,
    valeurIndicateur: a.valeurIndicateur,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export const ACTION_INCLUDE = { axe: true, pays: true, entite: true } as const;
