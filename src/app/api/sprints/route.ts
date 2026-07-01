import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { sprintCreateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    if (!planId) return fail('VALIDATION', 'planId requis', 422);
    const sprints = await prisma.sprint.findMany({
      where: { planId },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
    });
    return ok(sprints);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = sprintCreateSchema.parse(await req.json());
    const sprint = await prisma.sprint.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'Sprint', entiteId: sprint.id, apres: sprint }, req);
    return ok(sprint, 201);
  } catch (e) {
    return handleError(e);
  }
}
