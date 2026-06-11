import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { actionUpdateSchema } from '@/lib/zod';
import { ACTION_INCLUDE, serializeAction } from '@/lib/serialize';
import { requireEdit } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await prisma.action.findUnique({
      where: { id: params.id },
      include: { ...ACTION_INCLUDE, jalons: true, historique: { orderBy: { date: 'asc' } } },
    });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);
    return ok(serializeAction(action));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.action.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(existing.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const body = await req.json();
    const parsed = actionUpdateSchema.parse(body);

    const updated = await prisma.action.update({
      where: { id: params.id },
      data: parsed,
      include: ACTION_INCLUDE,
    });

    // Si l'avancement ou le statut change, on enregistre un snapshot
    const avancementChanged =
      parsed.avancement !== undefined && parsed.avancement !== existing.avancement;
    const statutChanged = parsed.statut !== undefined && parsed.statut !== existing.statut;
    if (avancementChanged || statutChanged) {
      await prisma.avancement.create({
        data: { actionId: updated.id, valeur: updated.avancement, statut: updated.statut },
      });
    }

    return ok(serializeAction(updated));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.action.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(existing.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    await prisma.action.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
