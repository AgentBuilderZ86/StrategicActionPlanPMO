import type { Prisma } from '@prisma/client';
import { calculerCodesArbre } from './tree';

/**
 * Recalcule et persiste le code de tous les nœuds d'un plan, de façon cohérente
 * avec l'arbre (T0.2). À appeler dans une transaction après toute modification
 * structurelle (création, déplacement, réordonnancement). Renvoie la Map des
 * codes calculés (id → code) pour éviter une relecture côté appelant.
 */
export async function reindexerCodesPlan(
  tx: Prisma.TransactionClient,
  planId: string,
): Promise<Map<string, string>> {
  const actions = await tx.action.findMany({
    where: { planId },
    select: { id: true, parentId: true, niveau: true, ordre: true },
  });
  const codes = calculerCodesArbre(actions);

  // On remet les codes à NULL d'abord : sinon un réordonnancement qui permute
  // deux codes violerait transitoirement la contrainte d'unicité [planId, code].
  await tx.action.updateMany({ where: { planId }, data: { code: null } });
  for (const [id, code] of codes) {
    await tx.action.update({ where: { id }, data: { code } });
  }
  return codes;
}
