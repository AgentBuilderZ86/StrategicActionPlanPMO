import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { soumettreValidationSchema } from '@/lib/zod';
import { getCurrentUser, requireEdit } from '@/lib/permissions';
import { roleValidateurPourNiveau } from '@/lib/constants';
import { logAction } from '@/lib/audit';
import { notifierRoles } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/** Historique des demandes de validation d'une action. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const demandes = await prisma.demandeValidation.findMany({
      where: { actionId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return ok(demandes);
  } catch (e) {
    return handleError(e);
  }
}

/** Soumettre une action pour validation hiérarchique. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await prisma.action.findUnique({
      where: { id: params.id },
      select: { id: true, titre: true, paysId: true, niveau: true },
    });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(action.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    // Une seule demande en attente à la fois.
    const enCours = await prisma.demandeValidation.findFirst({
      where: { actionId: params.id, statut: 'EN_ATTENTE' },
      select: { id: true },
    });
    if (enCours) return fail('CONFLICT', 'Une demande de validation est déjà en attente', 409);

    const { commentaire } = soumettreValidationSchema.parse(await req.json().catch(() => ({})));
    const user = await getCurrentUser();
    const roleValidateur = roleValidateurPourNiveau(action.niveau);

    const demande = await prisma.demandeValidation.create({
      data: {
        actionId: params.id,
        demandeurId: user?.id ?? null,
        demandeurNom: user?.email ?? null,
        statut: 'EN_ATTENTE',
        roleValidateur,
        commentaire: commentaire ?? null,
      },
    });

    await notifierRoles([roleValidateur], {
      type: 'VALIDATION',
      titre: `Validation demandée : ${action.titre}`,
      message: commentaire ?? null,
      lien: `/actions?focus=${action.id}`,
    });
    await logAction({ action: 'CREATE', entite: 'DemandeValidation', entiteId: demande.id, apres: demande }, req);

    return ok(demande, 201);
  } catch (e) {
    return handleError(e);
  }
}
