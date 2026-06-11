import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { entiteSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = entiteSchema.partial().parse(await req.json());
    const entite = await prisma.entite.update({ where: { id: params.id }, data: parsed });
    return ok(entite);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const count = await prisma.action.count({ where: { entiteId: params.id } });
    if (count > 0) return fail('CONFLICT', `Entité utilisée par ${count} action(s)`, 409);
    await prisma.entite.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
