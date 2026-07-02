import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { itemCreateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const planId = q.get('planId');
    if (!planId) return fail('VALIDATION', 'planId requis', 422);
    const where: Prisma.ItemBacklogWhereInput = { planId };
    if (q.get('sprintId')) where.sprintId = q.get('sprintId');
    const items = await prisma.itemBacklog.findMany({
      where,
      orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
    });
    return ok(items);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = itemCreateSchema.parse(await req.json());
    const item = await prisma.itemBacklog.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'ItemBacklog', entiteId: item.id, apres: item }, req);
    return ok(item, 201);
  } catch (e) {
    return handleError(e);
  }
}
