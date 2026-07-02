import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** Révoque un jeton d'API (conservé pour l'audit, mais désactivé). */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    await prisma.apiToken.update({ where: { id: params.id }, data: { revoque: true } });
    await logAction({ action: 'UPDATE', entite: 'ApiToken', entiteId: params.id, apres: { revoque: true } }, req);
    return ok({ id: params.id, revoque: true });
  } catch (e) {
    return handleError(e);
  }
}
