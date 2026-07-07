import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { importerActionsCommeInitiatives } from '@/lib/ppm-db';
import { getActivePlan } from '@/lib/data';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** Reprise DSI : import des actions du plan en initiatives (ADMIN/PMO, idempotent). */
export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const body = (await req.json().catch(() => ({}))) as { planId?: string };
    const plan = await getActivePlan(body.planId);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    const resultat = await importerActionsCommeInitiatives(plan.id);
    await logAction({ action: 'CREATE', entite: 'InitiativeImport', entiteId: plan.id, apres: resultat }, req);
    return ok(resultat);
  } catch (e) {
    return handleError(e);
  }
}
