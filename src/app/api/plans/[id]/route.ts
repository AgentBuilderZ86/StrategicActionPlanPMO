import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { planSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = planSchema.partial().parse(await req.json());
    const plan = await prisma.plan.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'Plan', entiteId: plan.id, apres: plan }, req);
    return ok(plan);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    await prisma.plan.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Plan', entiteId: params.id }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
