import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/** File d'attente des demandes de validation adressées au rôle du validateur. */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);
    if (user.role !== 'ADMIN' && user.role !== 'PMO') {
      return fail('FORBIDDEN', 'Action non autorisée', 403);
    }

    const statut = new URL(req.url).searchParams.get('statut') ?? 'EN_ATTENTE';
    const where: Prisma.DemandeValidationWhereInput = { statut };
    // L'ADMIN voit tout ; le PMO voit les demandes qui lui sont adressées.
    if (user.role === 'PMO') where.roleValidateur = 'PMO';

    const demandes = await prisma.demandeValidation.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { action: { select: { id: true, titre: true, code: true, niveau: true } } },
    });
    return ok(demandes);
  } catch (e) {
    return handleError(e);
  }
}
