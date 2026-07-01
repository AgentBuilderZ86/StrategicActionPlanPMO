import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { indicateurUpdateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function chargerScope(id: string) {
  const indicateur = await prisma.indicateur.findUnique({
    where: { id },
    include: { action: { select: { paysId: true } } },
  });
  return indicateur;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await chargerScope(params.id);
    if (!existing) return fail('NOT_FOUND', 'Indicateur introuvable', 404);

    const guard = await requireEdit(existing.action.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const parsed = indicateurUpdateSchema.parse(await req.json());
    const indicateur = await prisma.indicateur.update({ where: { id: params.id }, data: parsed });
    await logAction({ action: 'UPDATE', entite: 'Indicateur', entiteId: indicateur.id, avant: existing, apres: indicateur }, req);
    return ok(indicateur);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await chargerScope(params.id);
    if (!existing) return fail('NOT_FOUND', 'Indicateur introuvable', 404);

    const guard = await requireEdit(existing.action.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    await prisma.indicateur.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Indicateur', entiteId: params.id, avant: existing }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
