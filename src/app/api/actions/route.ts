import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { actionCreateSchema } from '@/lib/zod';
import { ACTION_INCLUDE, serializeAction } from '@/lib/serialize';
import { requireEdit } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const SORTABLE = new Set(['titre', 'statut', 'avancement', 'priorite', 'dateFin', 'budget', 'updatedAt']);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams;

    const where: Prisma.ActionWhereInput = {};
    const planId = q.get('planId');
    if (planId) where.planId = planId;
    if (q.get('paysId')) where.paysId = q.get('paysId')!;
    if (q.get('entiteId')) where.entiteId = q.get('entiteId')!;
    if (q.get('axeId')) where.axeId = q.get('axeId')!;
    if (q.get('statut')) where.statut = q.get('statut')!;
    if (q.get('priorite')) where.priorite = q.get('priorite')!;

    const search = q.get('q');
    if (search) {
      where.OR = [
        { titre: { contains: search } },
        { description: { contains: search } },
        { responsable: { contains: search } },
        { commentaire: { contains: search } },
      ];
    }

    // Filtre dérivé « en retard » : non terminé et échéance dépassée
    if (q.get('enRetard') === '1') {
      where.statut = { not: 'TERMINE' };
      where.dateFin = { lt: new Date() };
    }

    const sortRaw = q.get('sort') ?? 'updatedAt';
    const sort = SORTABLE.has(sortRaw) ? sortRaw : 'updatedAt';
    const dir = q.get('dir') === 'asc' ? 'asc' : 'desc';

    const page = Math.max(1, Number(q.get('page') ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(q.get('pageSize') ?? 50)));

    const [total, rows] = await Promise.all([
      prisma.action.count({ where }),
      prisma.action.findMany({
        where,
        include: ACTION_INCLUDE,
        orderBy: { [sort]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      data: rows.map(serializeAction),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const body = await req.json();
    const parsed = actionCreateSchema.parse(body);

    const created = await prisma.action.create({
      data: parsed,
      include: ACTION_INCLUDE,
    });

    // Snapshot initial d'avancement pour la courbe de tendance
    await prisma.avancement.create({
      data: { actionId: created.id, valeur: created.avancement, statut: created.statut },
    });

    return ok(serializeAction(created), 201);
  } catch (e) {
    return handleError(e);
  }
}
