import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { indicateurCreateSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const indicateurs = await prisma.indicateur.findMany({
      where: { actionId: params.id },
      orderBy: { createdAt: 'asc' },
    });
    return ok(indicateurs);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await prisma.action.findUnique({ where: { id: params.id } });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(action.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const parsed = indicateurCreateSchema.parse(await req.json());
    const indicateur = await prisma.indicateur.create({
      data: { ...parsed, actionId: params.id },
    });
    await logAction({ action: 'CREATE', entite: 'Indicateur', entiteId: indicateur.id, apres: indicateur }, req);
    return ok(indicateur, 201);
  } catch (e) {
    return handleError(e);
  }
}
