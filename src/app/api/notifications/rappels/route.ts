import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { genererRappelsEcheance } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Génère les rappels d'échéance (exig. 18). Réservé ADMIN/PMO ; peut être
 * déclenché par un cron (Netlify scheduled function) ultérieurement.
 */
export async function POST() {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const crees = await genererRappelsEcheance();
    return ok({ crees });
  } catch (e) {
    return handleError(e);
  }
}
