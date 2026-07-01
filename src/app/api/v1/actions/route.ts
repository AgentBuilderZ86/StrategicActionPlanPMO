import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { actionCreateSchema } from '@/lib/zod';
import { ACTION_INCLUDE, serializeAction } from '@/lib/serialize';
import { authentifierToken } from '@/lib/apitoken';
import { reindexerCodesPlan } from '@/lib/codes';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** API v1 — lecture des actions. Authentification : `Authorization: Bearer <token>`. */
export async function GET(req: Request) {
  try {
    const token = await authentifierToken(req);
    if (!token) return fail('UNAUTHENTICATED', 'Jeton d’API invalide ou révoqué', 401);

    const q = new URL(req.url).searchParams;
    const where = q.get('planId') ? { planId: q.get('planId')! } : {};
    const rows = await prisma.action.findMany({ where, include: ACTION_INCLUDE, orderBy: { updatedAt: 'desc' }, take: 1000 });
    return ok({ version: 'v1', data: rows.map(serializeAction) });
  } catch (e) {
    return handleError(e);
  }
}

/** API v1 — création d'action (jetons `read_write` uniquement). */
export async function POST(req: Request) {
  try {
    const token = await authentifierToken(req);
    if (!token) return fail('UNAUTHENTICATED', 'Jeton d’API invalide ou révoqué', 401);
    if (token.scopes !== 'read_write') return fail('FORBIDDEN', 'Jeton en lecture seule', 403);

    const parsed = actionCreateSchema.parse(await req.json());
    const created = await prisma.$transaction(async (tx) => {
      const c = await tx.action.create({ data: parsed });
      await reindexerCodesPlan(tx, c.planId);
      return tx.action.findUniqueOrThrow({ where: { id: c.id }, include: ACTION_INCLUDE });
    });
    await logAction(
      { action: 'CREATE', entite: 'Action', entiteId: created.id, apres: created, userEmail: `api:${token.prefix}` },
      req,
    );
    return ok({ version: 'v1', data: serializeAction(created) }, 201);
  } catch (e) {
    return handleError(e);
  }
}
