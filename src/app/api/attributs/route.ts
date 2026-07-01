import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { attributDefCreateSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    // Renvoie les définitions globales (planId null) + celles du plan demandé.
    const where: Prisma.AttributDefWhereInput = planId
      ? { OR: [{ planId }, { planId: null }] }
      : {};
    const defs = await prisma.attributDef.findMany({
      where,
      orderBy: [{ ordre: 'asc' }, { libelle: 'asc' }],
    });
    return ok(defs);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const parsed = attributDefCreateSchema.parse(await req.json());
    const def = await prisma.attributDef.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'AttributDef', entiteId: def.id, apres: def }, req);
    return ok(def, 201);
  } catch (e) {
    return handleError(e);
  }
}
