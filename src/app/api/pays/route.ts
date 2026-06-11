import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { paysSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    const pays = await prisma.pays.findMany({
      where: planId ? { planId } : undefined,
      orderBy: { nom: 'asc' },
    });
    return ok(pays);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = paysSchema.parse(await req.json());
    const pays = await prisma.pays.create({ data: parsed });
    return ok(pays, 201);
  } catch (e) {
    return handleError(e);
  }
}
