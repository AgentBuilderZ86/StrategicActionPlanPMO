import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { commentaireSchema } from '@/lib/zod';
import { getCurrentUser, requireRole } from '@/lib/permissions';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO', 'CONTRIBUTEUR', 'LECTEUR']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const commentaires = await prisma.commentaire.findMany({
      where: { actionId: params.id },
      orderBy: { createdAt: 'asc' },
    });
    return ok(commentaires);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Tout utilisateur connecté peut commenter (collaboration).
    const guard = await requireRole(['ADMIN', 'PMO', 'CONTRIBUTEUR', 'LECTEUR']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const action = await prisma.action.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);

    const { contenu } = commentaireSchema.parse(await req.json());
    const user = await getCurrentUser();
    const commentaire = await prisma.commentaire.create({
      data: {
        actionId: params.id,
        auteurId: user?.id ?? null,
        auteurNom: user?.email ?? null,
        contenu,
      },
    });
    await logAction({ action: 'CREATE', entite: 'Commentaire', entiteId: commentaire.id, apres: { actionId: params.id } }, req);
    return ok(commentaire, 201);
  } catch (e) {
    return handleError(e);
  }
}
