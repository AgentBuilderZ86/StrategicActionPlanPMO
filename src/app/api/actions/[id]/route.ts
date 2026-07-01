import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { actionUpdateSchema } from '@/lib/zod';
import { ACTION_INCLUDE, serializeAction } from '@/lib/serialize';
import { requireEdit } from '@/lib/permissions';
import { construireArbre, aplatirArbre, idsDescendants, niveauEnfantAttendu } from '@/lib/tree';
import { reindexerCodesPlan } from '@/lib/codes';
import { consoliderIndicateurs } from '@/lib/indicateurs';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await prisma.action.findUnique({
      where: { id: params.id },
      include: ACTION_INCLUDE,
    });
    if (!action) return fail('NOT_FOUND', 'Action introuvable', 404);

    // Indicateurs propres au nœud + consolidation ascendante de son sous-arbre (T1.2).
    const [indicateurs, planActions] = await Promise.all([
      prisma.indicateur.findMany({ where: { actionId: params.id }, orderBy: { createdAt: 'asc' } }),
      prisma.action.findMany({
        where: { planId: action.planId },
        select: { id: true, parentId: true, niveau: true, ordre: true },
      }),
    ]);
    const noeud = aplatirArbre(construireArbre(planActions)).find((n) => n.id === params.id);
    const sousArbreIds = noeud ? idsDescendants(noeud) : [params.id];
    const indicsSousArbre = await prisma.indicateur.findMany({ where: { actionId: { in: sousArbreIds } } });

    return ok({
      ...serializeAction(action),
      indicateurs,
      indicateursConsolides: consoliderIndicateurs(indicsSousArbre),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.action.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(existing.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const body = await req.json();
    const parsed = actionUpdateSchema.parse(body);

    // Déplacement de nœud : si le parent change, on valide (pas de cycle, même
    // plan) et on recalcule le niveau du nœud et de toute sa descendance.
    let recompute: { id: string; niveau: number }[] = [];
    const parentChange = parsed.parentId !== undefined && parsed.parentId !== existing.parentId;
    if (parentChange) {
      const nouveauParentId = parsed.parentId ?? null;
      if (nouveauParentId === existing.id) {
        return fail('VALIDATION', 'Un nœud ne peut pas être son propre parent', 422);
      }

      const fratrie = await prisma.action.findMany({
        where: { planId: existing.planId },
        select: { id: true, parentId: true, niveau: true, ordre: true },
      });
      // Sous-arbre enraciné sur le nœud déplacé (le nœud + ses descendants).
      const noeud = aplatirArbre(construireArbre(fratrie)).find((n) => n.id === existing.id);
      const sousArbre = noeud ? aplatirArbre([noeud]) : [];
      const descendants = new Set(sousArbre.map((n) => n.id));

      let niveauNoeud = existing.niveau;
      if (nouveauParentId) {
        if (descendants.has(nouveauParentId)) {
          return fail('VALIDATION', 'Déplacement impossible : parent situé dans la descendance', 422);
        }
        const parent = fratrie.find((n) => n.id === nouveauParentId);
        if (!parent) return fail('VALIDATION', 'Nœud parent introuvable', 422);
        niveauNoeud = niveauEnfantAttendu(parent.niveau);
      }
      parsed.niveau = niveauNoeud;

      // Recalcul en cascade des niveaux de la descendance (relatif au nœud).
      const delta = niveauNoeud - existing.niveau;
      if (delta !== 0) {
        recompute = sousArbre
          .filter((n) => n.id !== existing.id)
          .map((n) => ({ id: n.id, niveau: (n.niveau ?? 1) + delta }));
      }
    }

    // Un changement de structure (parent, ordre, niveau) impose de recalculer
    // les codes de tout le plan (T0.2).
    const structuralChange =
      parentChange ||
      (parsed.ordre !== undefined && parsed.ordre !== existing.ordre) ||
      (parsed.niveau !== undefined && parsed.niveau !== existing.niveau);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.action.update({ where: { id: params.id }, data: parsed });
      for (const r of recompute) {
        await tx.action.update({ where: { id: r.id }, data: { niveau: r.niveau } });
      }
      if (structuralChange) await reindexerCodesPlan(tx, existing.planId);
      return tx.action.findUniqueOrThrow({ where: { id: params.id }, include: ACTION_INCLUDE });
    });

    // Si l'avancement ou le statut change, on enregistre un snapshot
    const avancementChanged =
      parsed.avancement !== undefined && parsed.avancement !== existing.avancement;
    const statutChanged = parsed.statut !== undefined && parsed.statut !== existing.statut;
    if (avancementChanged || statutChanged) {
      await prisma.avancement.create({
        data: { actionId: updated.id, valeur: updated.avancement, statut: updated.statut },
      });
    }

    await logAction(
      { action: 'UPDATE', entite: 'Action', entiteId: updated.id, avant: existing, apres: updated },
      req,
    );

    return ok(serializeAction(updated));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.action.findUnique({ where: { id: params.id } });
    if (!existing) return fail('NOT_FOUND', 'Action introuvable', 404);

    const guard = await requireEdit(existing.paysId);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    await prisma.action.delete({ where: { id: params.id } });
    await logAction({ action: 'DELETE', entite: 'Action', entiteId: params.id, avant: existing }, req);
    return ok({ id: params.id, deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
