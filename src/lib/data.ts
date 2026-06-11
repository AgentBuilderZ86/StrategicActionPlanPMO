import { prisma } from './prisma';

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
