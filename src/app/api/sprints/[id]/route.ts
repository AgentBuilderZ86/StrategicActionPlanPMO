import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { sprintUpdateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = sprintUpdateSchema.parse(await req.json());
    const sprint = await prisma.sprint.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'Sprint', entiteId: sprint.id, apres: sprint }, req);
    return ok(sprint);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    await prisma.sprint.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Sprint', entiteId: params.id }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
