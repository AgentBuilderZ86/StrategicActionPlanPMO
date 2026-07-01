import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { entiteSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = entiteSchema.partial().parse(await req.json());
    const entite = await prisma.entite.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'Entite', entiteId: entite.id, apres: entite }, req);
    return ok(entite);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const count = await prisma.action.count({ where: { entiteId: params.id } });
    if (count > 0) return fail('CONFLICT', `Entité utilisée par ${count} action(s)`, 409);
    await prisma.entite.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Entite', entiteId: params.id }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
