import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { pulseSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Enregistre un pulse AGRÉGÉ (jamais de réponse individuelle).
 * Le k-anonymat (répondants >= 8) est imposé par le schéma de validation.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const population = await prisma.population.findUnique({ where: { id: params.id } });
    if (!population) return fail('NOT_FOUND', 'Population introuvable', 404);
    const parsed = pulseSchema.parse(await req.json());
    const created = await prisma.pulse.create({ data: { ...parsed, populationId: params.id } });
    await logAction({ action: 'CREATE', entite: 'Pulse', entiteId: created.id, apres: created }, req);
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
