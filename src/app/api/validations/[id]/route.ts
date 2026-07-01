import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { deciderValidationSchema } from '@/lib/zod';
import { getCurrentUser } from '@/lib/permissions';
import { logAction } from '@/lib/audit';
import { notifierUtilisateurs } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/** Décision du validateur (approbation / rejet) sur une demande. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);
    if (user.role !== 'ADMIN' && user.role !== 'PMO') {
      return fail('FORBIDDEN', 'Action non autorisée', 403);
    }

    const demande = await prisma.demandeValidation.findUnique({
      where: { id: params.id },
      include: { action: { select: { titre: true, id: true } } },
    });
    if (!demande) return fail('NOT_FOUND', 'Demande introuvable', 404);
    if (demande.statut !== 'EN_ATTENTE') return fail('CONFLICT', 'Demande déjà traitée', 409);
    // Validation hiérarchique : le PMO ne valide que les demandes de son ressort.
    if (user.role === 'PMO' && demande.roleValidateur !== 'PMO') {
      return fail('FORBIDDEN', 'Validation réservée à un administrateur', 403);
    }

    const { decision, commentaire } = deciderValidationSchema.parse(await req.json());
    const updated = await prisma.demandeValidation.update({
      where: { id: params.id },
      data: {
        statut: decision,
        validateurId: user.id,
        validateurNom: user.email ?? null,
        commentaire: commentaire ?? demande.commentaire,
        decideeAt: new Date(),
      },
    });

    if (demande.demandeurId) {
      await notifierUtilisateurs([demande.demandeurId], {
        type: 'VALIDATION',
        titre: `Demande ${decision === 'APPROUVE' ? 'approuvée' : 'rejetée'} : ${demande.action.titre}`,
        message: commentaire ?? null,
        lien: `/actions?focus=${demande.action.id}`,
      });
    }
    await logAction({ action: 'UPDATE', entite: 'DemandeValidation', entiteId: updated.id, avant: demande, apres: updated }, req);

    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
