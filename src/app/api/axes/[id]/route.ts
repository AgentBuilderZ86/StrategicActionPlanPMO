import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { axeSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = axeSchema.partial().parse(await req.json());
    const axe = await prisma.axe.update({ where: { id: params.id }, data: parsed });
    return ok(axe);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const count = await prisma.action.count({ where: { axeId: params.id } });
    if (count > 0) return fail('CONFLICT', `Axe utilisé par ${count} action(s)`, 409);
    await prisma.axe.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
