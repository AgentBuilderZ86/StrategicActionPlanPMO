import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { envoyerDigest } from '@/lib/alertes-db';
import { getActivePlan } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Envoie le digest des alertes ouvertes aux ADMIN/PMO (notification in-app). */
export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const body = (await req.json().catch(() => ({}))) as { planId?: string };
    const plan = await getActivePlan(body.planId);
    if (!plan) return fail('NOT_FOUND', 'Aucun plan actif', 404);
    const envoye = await envoyerDigest(plan.id);
    return ok({ envoye });
  } catch (e) {
    return handleError(e);
  }
}
