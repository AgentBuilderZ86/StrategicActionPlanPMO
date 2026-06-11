import { prisma } from '@/lib/prisma';
import { ok, handleError } from '@/lib/api';
import { seedDemo } from '@/lib/seed';

export const dynamic = 'force-dynamic';

/**
 * Endpoint d'initialisation : crée le jeu de démonstration sur la base
 * connectée.
 *
 * - Si la base est VIDE (aucun utilisateur) : amorçage autorisé sans clé
 *   (bootstrap à usage unique, inoffensif — ne fait qu'insérer le jeu démo).
 * - Si la base contient déjà des données : réamorçage destructif autorisé
 *   uniquement avec ?key=<NEXTAUTH_SECRET>&force=1.
 *
 * L'endpoint se verrouille de lui-même une fois la base peuplée.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const force = url.searchParams.get('force') === '1';
    const secret = process.env.NEXTAUTH_SECRET;

    const existing = await prisma.user.count();

    if (existing > 0) {
      if (key !== secret || !secret) {
        return ok({
          seeded: false,
          message: `Base déjà initialisée (${existing} utilisateur(s)). Réamorçage : ?key=<NEXTAUTH_SECRET>&force=1.`,
        });
      }
      if (!force) {
        return ok({
          seeded: false,
          message: 'Ajoutez ?force=1 pour réamorcer (destructif).',
        });
      }
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
