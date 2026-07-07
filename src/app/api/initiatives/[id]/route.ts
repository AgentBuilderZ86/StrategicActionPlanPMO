import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireDroit, requireRole } from '@/lib/permissions';
import { initiativeUpdateSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireDroit('saisie');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const existing = await prisma.initiative.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Initiative introuvable', 404);
    const parsed = initiativeUpdateSchema.parse(await req.json());
    const updated = await prisma.initiative.update({ where: { id: params.id }, data: parsed });
    await logAction(
      { action: 'UPDATE', entite: 'Initiative', entiteId: updated.id, avant: existing, apres: updated },
      req,
    );
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const existing = await prisma.initiative.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Initiative introuvable', 404);
    await prisma.initiative.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Initiative', entiteId: params.id, avant: existing }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
