import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { entiteSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    const entites = await prisma.entite.findMany({
      where: planId ? { planId } : undefined,
      include: { pays: true },
      orderBy: { nom: 'asc' },
    });
    return ok(entites);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = entiteSchema.parse(await req.json());
    const entite = await prisma.entite.create({ data: parsed });
    return ok(entite, 201);
  } catch (e) {
    return handleError(e);
  }
}
