import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { itemUpdateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = itemUpdateSchema.parse(await req.json());
    const item = await prisma.itemBacklog.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'ItemBacklog', entiteId: item.id, apres: item }, req);
    return ok(item);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    await prisma.itemBacklog.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'ItemBacklog', entiteId: params.id }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
