import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { attributValeursSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const valeurs = await prisma.attributValeur.findMany({ where: { actionId: params.id } });
    return ok(valeurs);
  } catch (e) {
    return handleError(e);
  }
}

/** Upsert des valeurs d'attributs d'une action (map { defId: valeur|null }). */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await prisma.action.findUnique({ where: { id: params.id }, select: { id: true, paysId: true } });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(action.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const { valeurs } = attributValeursSchema.parse(await req.json());

    await prisma.$transaction(
      Object.entries(valeurs).map(([attributDefId, valeur]) =>
        prisma.attributValeur.upsert({
          where: { actionId_attributDefId: { actionId: params.id, attributDefId } },
          create: { actionId: params.id, attributDefId, valeur },
          update: { valeur },
        }),
      ),
    );

    await logAction({ action: 'UPDATE', entite: 'AttributValeur', entiteId: params.id, apres: { valeurs } }, req);
    const out = await prisma.attributValeur.findMany({ where: { actionId: params.id } });
    return ok(out);
  } catch (e) {
    return handleError(e);
  }
}
