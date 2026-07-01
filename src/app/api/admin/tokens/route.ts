import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser, requireRole } from '@/lib/permissions';
import { genererToken, hashToken } from '@/lib/apitoken';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  nom: z.string().min(1).max(120),
  scopes: z.enum(['read', 'read_write']).default('read'),
});

export async function GET() {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const tokens = await prisma.apiToken.findMany({
      select: { id: true, nom: true, prefix: true, scopes: true, dernierAcces: true, revoque: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return ok(tokens);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const { nom, scopes } = createSchema.parse(await req.json());
    const { token, prefix } = genererToken();
    const user = await getCurrentUser();
    const created = await prisma.apiToken.create({
      data: { nom, scopes, prefix, tokenHash: hashToken(token), createdById: user?.id ?? null },
      select: { id: true, nom: true, prefix: true, scopes: true, createdAt: true },
    });
    await logAction({ action: 'CREATE', entite: 'ApiToken', entiteId: created.id, apres: created }, req);
    // Le jeton en clair n'est renvoyé qu'une seule fois, à la création.
    return ok({ ...created, token }, 201);
  } catch (e) {
    return handleError(e);
  }
}
