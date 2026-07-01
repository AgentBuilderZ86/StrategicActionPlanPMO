import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { attributDefUpdateSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = attributDefUpdateSchema.parse(await req.json());
    const def = await prisma.attributDef.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'AttributDef', entiteId: def.id, apres: def }, req);
    return ok(def);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    await prisma.attributDef.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'AttributDef', entiteId: params.id }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
