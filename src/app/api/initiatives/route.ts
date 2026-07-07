import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireDroit } from '@/lib/permissions';
import { initiativeSchema } from '@/lib/zod';
import { creerInitiative, getInitiatives } from '@/lib/ppm-db';
import { getActivePlan } from '@/lib/data';
import { logAction } from '@/lib/audit';
import { notifierRoles } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireDroit('lecture');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const planId = new URL(req.url).searchParams.get('planId');
    const plan = await getActivePlan(planId ?? undefined);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    return ok(await getInitiatives(plan.id));
  } catch (e) {
    return handleError(e);
  }
}

/** Soumission d'une initiative — ouverte aux profils de saisie (DSI ET métiers). */
export async function POST(req: Request) {
  try {
    const guard = await requireDroit('saisie');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = initiativeSchema.parse(await req.json());
    const { planId, ...input } = parsed;
    const created = await creerInitiative(planId, input);
    await logAction({ action: 'CREATE', entite: 'Initiative', entiteId: created.id, apres: created }, req);
    await notifierRoles(['ADMIN', 'PMO'], {
      type: 'PPM',
      titre: `Nouvelle initiative à qualifier : ${created.titre}`,
      lien: `/pipeline?focus=${created.id}`,
    });
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
