import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { ALERTE_STATUTS, transitionValide } from '@/lib/alertes';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  statut: z.enum(ALERTE_STATUTS),
  motif: z.string().max(500).optional().nullable(),
});

/** Cycle de vie d'une alerte : prise en charge, résolution, acceptation du risque. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const existing = await prisma.alerte.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Alerte introuvable', 404);

    const parsed = patchSchema.parse(await req.json());
    if (!transitionValide(existing.statut, parsed.statut)) {
      return fail('VALIDATION', `Transition ${existing.statut} → ${parsed.statut} non autorisée`, 422);
    }
    if (parsed.statut === 'ACCEPTEE' && !parsed.motif?.trim()) {
      return fail('VALIDATION', 'Un motif est requis pour accepter un risque (traçabilité COPIL)', 422);
    }

    const updated = await prisma.alerte.update({
      where: { id: params.id },
      data: { statut: parsed.statut, motif: parsed.motif?.trim() || existing.motif },
    });
    await logAction(
      { action: 'UPDATE', entite: 'Alerte', entiteId: updated.id, avant: existing, apres: updated },
      req,
    );
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
