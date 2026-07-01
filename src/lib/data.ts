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
import type { DimensionKey } from './constants';

/** Renvoie le plan « actif » (le plus récent). En V1, un seul plan de démo. */
export async function getActivePlan(planId?: string) {
  if (planId) {
    return prisma.plan.findUnique({ where: { id: planId } });
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
