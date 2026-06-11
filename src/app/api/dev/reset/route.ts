import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { seedDemo } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return fail('FORBIDDEN', 'Réinitialisation désactivée en production', 403);
    }
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const result = await seedDemo(prisma);
    return ok({ reset: true, actions: result.actions });
  } catch (e) {
    return handleError(e);
  }
}
