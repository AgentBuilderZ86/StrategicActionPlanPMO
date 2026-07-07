import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireDroit, requireRole } from '@/lib/permissions';
import { getDomaines } from '@/lib/ppm-db';
import { getActivePlan } from '@/lib/data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireDroit('lecture');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const planId = new URL(req.url).searchParams.get('planId');
    const plan = await getActivePlan(planId ?? undefined);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    return ok(await getDomaines(plan.id));
  } catch (e) {
    return handleError(e);
  }
}

const sousDomaineSchema = z.object({
  domaineId: z.string().min(1),
  nom: z.string().min(1).max(120),
});

/** Ajoute un sous-domaine au référentiel (ADMIN/PMO). */
export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = sousDomaineSchema.parse(await req.json());
    const created = await prisma.sousDomaine.create({ data: parsed });
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
