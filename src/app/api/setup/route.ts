import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { seedDemo } from '@/lib/seed';

export const dynamic = 'force-dynamic';

/**
 * Endpoint d'initialisation à usage unique : crée le jeu de démonstration sur
 * la base connectée. Protégé par une clé (?key=) comparée à NEXTAUTH_SECRET.
 * Par sécurité, ne réamorce que si la base est vide, sauf ?force=1.
 *
 * À retirer (ou laisser, il est inerte une fois la base peuplée) après le
 * premier amorçage en production.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret || key !== secret) {
      return fail('FORBIDDEN', 'Clé invalide', 403);
    }

    const force = url.searchParams.get('force') === '1';
    const existing = await prisma.user.count();
    if (existing > 0 && !force) {
      return ok({
        seeded: false,
        message: `Base déjà initialisée (${existing} utilisateur(s)). Utilisez ?force=1 pour réamorcer.`,
      });
    }

    const result = await seedDemo(prisma);
    return ok({
      seeded: true,
      plan: result.plan.nom,
      axes: result.axes,
      pays: result.pays,
      entites: result.entites,
      actions: result.actions,
      message: 'Initialisation terminée. Connectez-vous avec admin@pmo.demo / demo1234.',
    });
  } catch (e) {
    return handleError(e);
  }
}
