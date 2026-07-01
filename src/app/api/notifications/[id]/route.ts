import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/** Marque une notification comme lue (uniquement la sienne). */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);

    const notif = await prisma.notification.findUnique({ where: { id: params.id }, select: { userId: true } });
    if (!notif || notif.userId !== user.id) return fail('NOT_FOUND', 'Notification introuvable', 404);

    await prisma.notification.update({ where: { id: params.id }, data: { lu: true } });
    return ok({ id: params.id, lu: true });
  } catch (e) {
    return handleError(e);
  }
}
