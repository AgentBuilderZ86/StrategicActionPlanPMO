import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { paysSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = paysSchema.partial().parse(await req.json());
    const pays = await prisma.pays.update({ where: { id: params.id }, data: parsed });
    return ok(pays);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const count = await prisma.action.count({ where: { paysId: params.id } });
    if (count > 0) return fail('CONFLICT', `Pays utilisé par ${count} action(s)`, 409);
    await prisma.pays.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
