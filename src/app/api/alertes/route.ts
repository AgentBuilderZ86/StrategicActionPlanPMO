import { ok, fail, handleError } from '@/lib/api';
import { requireDroit, requireRole } from '@/lib/permissions';
import { getAlertes, synchroniserAlertes } from '@/lib/alertes-db';
import { getActivePlan } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Liste les alertes du plan (lecture). */
export async function GET(req: Request) {
  try {
    const guard = await requireDroit('lecture');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const planId = new URL(req.url).searchParams.get('planId');
    const plan = await getActivePlan(planId ?? undefined);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    return ok(await getAlertes(plan.id));
  } catch (e) {
    return handleError(e);
  }
}

/** Synchronise les alertes avec le moteur de risque (ADMIN/PMO, idempotent). */
export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const body = (await req.json().catch(() => ({}))) as { planId?: string };
    const plan = await getActivePlan(body.planId);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    return ok(await synchroniserAlertes(plan.id));
  } catch (e) {
    return handleError(e);
  }
}
