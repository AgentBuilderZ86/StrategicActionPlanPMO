import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser, requireDroit } from '@/lib/permissions';
import { transitionSchema } from '@/lib/zod';
import { transitionner } from '@/lib/ppm-db';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Transition de cycle de vie : contrôlée (flux autorisé), exigeante (champs
 * d'étape) et notifiée (matrice de rôles). Ouverte aux profils de saisie :
 * la DSI comme les métiers font avancer les initiatives.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireDroit('saisie');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const user = await getCurrentUser();
    const parsed = transitionSchema.parse(await req.json());
    const resultat = await transitionner(params.id, parsed.vers, user?.name ?? user?.email ?? 'inconnu', parsed);
    if (!resultat.ok) return fail(resultat.code, resultat.message, resultat.code === 'NOT_FOUND' ? 404 : 422);
    await logAction(
      { action: 'UPDATE', entite: 'InitiativeTransition', entiteId: params.id, apres: { vers: parsed.vers } },
      req,
    );
    return ok(resultat);
  } catch (e) {
    return handleError(e);
  }
}
