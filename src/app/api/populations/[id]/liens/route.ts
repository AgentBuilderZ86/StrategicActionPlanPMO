import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { liensPopulationSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** Remplace les liens action <-> population (impact) de la population. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const population = await prisma.population.findUnique({ where: { id: params.id } });
    if (!population) return fail('NOT_FOUND', 'Population introuvable', 404);
    const { liens } = liensPopulationSchema.parse(await req.json());

    await prisma.$transaction([
      prisma.actionPopulation.deleteMany({ where: { populationId: params.id } }),
      ...liens.map((l) =>
        prisma.actionPopulation.create({
          data: { populationId: params.id, actionId: l.actionId, niveauImpact: l.niveauImpact },
        }),
      ),
    ]);
    await logAction(
      { action: 'UPDATE', entite: 'PopulationLiens', entiteId: params.id, apres: { liens } },
      req,
    );
    return ok({ populationId: params.id, liens: liens.length });
  } catch (e) {
    return handleError(e);
  }
}
