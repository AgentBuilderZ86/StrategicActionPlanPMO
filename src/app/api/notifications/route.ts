import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser } from '@/lib/permissions';
import { genererRappelsEcheance } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/** Notifications de l'utilisateur courant (non lues d'abord). */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);

    // Sans cron : les responsables du pilotage génèrent les rappels d'échéance
    // au fil de l'eau (idempotent, dédupliqué). N'affecte pas le rendu si échec.
    if (user.role === 'ADMIN' || user.role === 'PMO') {
      await genererRappelsEcheance().catch(() => {});
    }

    const [data, nonLues] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: [{ lu: 'asc' }, { createdAt: 'desc' }],
        take: 30,
      }),
      prisma.notification.count({ where: { userId: user.id, lu: false } }),
    ]);
    return ok({ data, nonLues });
  } catch (e) {
    return handleError(e);
  }
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);
    await prisma.notification.updateMany({ where: { userId: user.id, lu: false }, data: { lu: true } });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
