import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ACTION_INCLUDE, serializeAction } from './serialize';
import {
  computeKpis,
  computeHeatmap,
  aggregateByDimension,
  repartitionStatuts,
  pointsAttention,
  computeTrend,
  type AggAction,
} from './aggregations';
import { pivot, crossMatrix } from './analyses';
import { computeVelocity } from './agile';
import { getSelectedPlanId } from './plan-context';
import type { DimensionKey } from './constants';

/**
 * Renvoie le plan actif : priorité au paramètre explicite (ex. `?planId=`),
 * puis à la sélection persistante de l'utilisateur (cookie, voir
 * `PlanSwitcher`), puis au premier plan créé. Centraliser cette résolution ici
 * fait que toutes les pages et routes API héritent automatiquement du plan
 * choisi dans l'en-tête, sans le répéter partout.
 */
export async function getActivePlan(planId?: string) {
  const id = planId || getSelectedPlanId();
  if (id) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (plan) return plan;
  }
  return prisma.plan.findFirst({ orderBy: { createdAt: 'asc' } });
}

export async function getPlans() {
  return prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function getReferentiels(planId: string) {
  const [axes, pays, entites] = await Promise.all([
    prisma.axe.findMany({ where: { planId }, orderBy: { ordre: 'asc' } }),
    prisma.pays.findMany({ where: { planId }, orderBy: { nom: 'asc' } }),
    prisma.entite.findMany({ where: { planId }, orderBy: { nom: 'asc' } }),
  ]);
  return { axes, pays, entites };
}

export type Periode = { from?: string | null; to?: string | null };

function periodeWhere(planId: string, periode?: Periode): Prisma.ActionWhereInput {
  const where: Prisma.ActionWhereInput = { planId };
  const and: Prisma.ActionWhereInput[] = [];
  if (periode?.from) {
    and.push({ OR: [{ dateFin: null }, { dateFin: { gte: new Date(periode.from) } }] });
  }
  if (periode?.to) {
    and.push({ OR: [{ dateDebut: null }, { dateDebut: { lte: new Date(periode.to) } }] });
  }
  if (and.length) where.AND = and;
  return where;
}

/** Agrégations serveur pour le dashboard — une seule fonction pour tout. */
export async function getDashboardData(planId: string, periode?: Periode) {
  const [actionsRaw, axes, pays, snapshots] = await Promise.all([
    prisma.action.findMany({ where: periodeWhere(planId, periode), include: ACTION_INCLUDE }),
    prisma.axe.findMany({ where: { planId }, orderBy: { ordre: 'asc' } }),
    prisma.pays.findMany({ where: { planId }, orderBy: { nom: 'asc' } }),
    prisma.avancement.findMany({
      where: { action: { planId } },
      select: { actionId: true, date: true, valeur: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const actions: AggAction[] = actionsRaw.map(serializeAction);

  return {
    kpis: computeKpis(actions),
    heatmap: computeHeatmap(
      actions,
      pays.map((p) => ({ id: p.id, nom: p.nom })),
      axes.map((a) => ({ id: a.id, nom: a.nom })),
    ),
    parAxe: aggregateByDimension(actions, (a) => a.axeId ?? '—', (a) => a.axe ?? '—'),
    parPays: aggregateByDimension(actions, (a) => a.paysId ?? '—', (a) => a.pays ?? '—'),
    statuts: repartitionStatuts(actions),
    attention: pointsAttention(actions).slice(0, 20),
    trend: computeTrend(snapshots),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getAnalysesData(
  planId: string,
  dim: DimensionKey,
  dim2: DimensionKey,
  periode?: Periode,
) {
  const rows = await prisma.action.findMany({
    where: periodeWhere(planId, periode),
    include: ACTION_INCLUDE,
  });
  const actions: AggAction[] = rows.map(serializeAction);
  return {
    pivot: pivot(actions, dim),
    cross: crossMatrix(actions, dim, dim2),
    dim,
    dim2,
  };
}

export type AnalysesData = Awaited<ReturnType<typeof getAnalysesData>>;

/** Données de planification : actions datées + jalons (T2.1). */
export async function getPlanningData(planId: string) {
  const [actions, jalons] = await Promise.all([
    prisma.action.findMany({
      where: { planId },
      select: {
        id: true, titre: true, code: true, dateDebut: true, dateFin: true,
        statut: true, avancement: true, niveau: true,
      },
      orderBy: [{ dateDebut: 'asc' }, { niveau: 'asc' }],
    }),
    prisma.jalon.findMany({
      where: { action: { planId } },
      select: { id: true, actionId: true, titre: true, date: true, atteint: true },
      orderBy: { date: 'asc' },
    }),
  ]);
  return {
    actions: actions.map((a) => ({
      ...a,
      dateDebut: a.dateDebut ? a.dateDebut.toISOString() : null,
      dateFin: a.dateFin ? a.dateFin.toISOString() : null,
    })),
    jalons: jalons.map((j) => ({ ...j, date: j.date.toISOString() })),
  };
}

export type PlanningData = Awaited<ReturnType<typeof getPlanningData>>;

/** Instantané agile d'un plan SI : sprint en cours + dernière vélocité connue
 *  (bandeau différencié de l'accueil, voir PlanBanner). */
export async function getAgileSnapshot(planId: string) {
  const [sprints, items] = await Promise.all([
    prisma.sprint.findMany({ where: { planId }, orderBy: { ordre: 'asc' } }),
    prisma.itemBacklog.findMany({
      where: { planId },
      select: { id: true, sprintId: true, statut: true, points: true },
    }),
  ]);

  const sprintEnCours = sprints.find((s) => s.statut === 'EN_COURS') ?? null;
  const velocity = computeVelocity(sprints, items);
  const derniereVelocity = [...velocity].reverse().find((v) => v.points > 0) ?? null;
  const pointsRestants = sprintEnCours
    ? items
        .filter((i) => i.sprintId === sprintEnCours.id && i.statut !== 'TERMINE')
        .reduce((s, i) => s + (i.points ?? 0), 0)
    : 0;

  return {
    sprintEnCours: sprintEnCours ? { nom: sprintEnCours.nom } : null,
    derniereVelocity,
    pointsRestants,
  };
}

export type AgileSnapshot = Awaited<ReturnType<typeof getAgileSnapshot>>;
