import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireDroit, requireRole } from '@/lib/permissions';
import { populationSchema } from '@/lib/zod';
import { getPopulations } from '@/lib/populations-db';
import { getActivePlan } from '@/lib/data';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireDroit('lecture');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const planId = new URL(req.url).searchParams.get('planId');
    const plan = await getActivePlan(planId ?? undefined);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    return ok(await getPopulations(plan.id));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = populationSchema.parse(await req.json());
    const created = await prisma.population.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'Population', entiteId: created.id, apres: created }, req);
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
