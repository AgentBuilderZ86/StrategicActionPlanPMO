import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { planSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
    return ok(plans);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = planSchema.parse(await req.json());
    const plan = await prisma.plan.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'Plan', entiteId: plan.id, apres: plan }, req);
    return ok(plan, 201);
  } catch (e) {
    return handleError(e);
  }
}
