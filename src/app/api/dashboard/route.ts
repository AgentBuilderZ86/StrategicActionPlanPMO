import { ok, fail, handleError } from '@/lib/api';
import { getActivePlan, getDashboardData } from '@/lib/data';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO', 'CONTRIBUTEUR', 'LECTEUR']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const q = new URL(req.url).searchParams;
    const planId = q.get('planId') ?? (await getActivePlan())?.id;
    if (!planId) return fail('NOT_FOUND', 'Aucun plan disponible', 404);
    const data = await getDashboardData(planId, { from: q.get('from'), to: q.get('to') });
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
