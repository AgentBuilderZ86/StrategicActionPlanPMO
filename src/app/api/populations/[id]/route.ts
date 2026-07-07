import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { populationUpdateSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const existing = await prisma.population.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Population introuvable', 404);
    const parsed = populationUpdateSchema.parse(await req.json());
    const updated = await prisma.population.update({ where: { id: params.id }, data: parsed });
    await logAction(
      { action: 'UPDATE', entite: 'Population', entiteId: updated.id, avant: existing, apres: updated },
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
    const existing = await prisma.population.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Population introuvable', 404);
    await prisma.population.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Population', entiteId: params.id, avant: existing }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
