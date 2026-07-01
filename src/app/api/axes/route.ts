import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { axeSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    const axes = await prisma.axe.findMany({
      where: planId ? { planId } : undefined,
      orderBy: { ordre: 'asc' },
    });
    return ok(axes);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = axeSchema.parse(await req.json());
    const axe = await prisma.axe.create({ data: parsed });
    await logAction({ action: 'CREATE', entite: 'Axe', entiteId: axe.id, apres: axe }, req);
    return ok(axe, 201);
  } catch (e) {
    return handleError(e);
  }
}
