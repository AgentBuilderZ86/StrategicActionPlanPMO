import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { importRowSchema } from '@/lib/zod';
import { requireEdit } from '@/lib/permissions';
import { STATUTS, PRIORITES } from '@/lib/constants';
import { reindexerCodesPlan } from '@/lib/codes';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type RowReport = { ligne: number; ok: boolean; message?: string; titre?: string };

function normStatut(v: unknown): string {
  const s = String(v ?? '').trim().toUpperCase().replace(/[\s-]/g, '_');
  const map: Record<string, string> = {
    A_LANCER: 'A_LANCER', 'À_LANCER': 'A_LANCER', EN_COURS: 'EN_COURS',
    TERMINE: 'TERMINE', TERMINÉ: 'TERMINE', BLOQUE: 'BLOQUE', BLOQUÉ: 'BLOQUE',
  };
  return (STATUTS as readonly string[]).includes(s) ? s : (map[s] ?? 'A_LANCER');
}
function normPriorite(v: unknown): string {
  const s = String(v ?? '').trim().toUpperCase();
  return (PRIORITES as readonly string[]).includes(s) ? s : 'MOYENNE';
}
function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}
function toNum(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: Request) {
  try {
    const guard = await requireEdit();
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const body = await req.json();
    const planId: string | undefined = body?.planId;
    const rows: unknown[] = Array.isArray(body?.rows) ? body.rows : [];
    if (!planId) return fail('VALIDATION', 'planId requis', 422);

    const [axes, pays, entites] = await Promise.all([
      prisma.axe.findMany({ where: { planId } }),
      prisma.pays.findMany({ where: { planId } }),
      prisma.entite.findMany({ where: { planId } }),
    ]);
    const findBy = <T extends { id: string; nom: string }>(list: T[], nom: string) =>
      list.find((x) => x.nom.trim().toLowerCase() === nom.trim().toLowerCase());

    const reports: RowReport[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const ligne = i + 2; // +1 en-tête, +1 base 1
      const parsed = importRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        reports.push({ ligne, ok: false, message: 'Champs requis manquants (titre/axe/pays/entité/responsable)' });
        continue;
      }
      const r = parsed.data;
      const axe = findBy(axes, r.axe);
      const py = findBy(pays, r.pays);
      const ent = findBy(entites, r.entite);
      if (!axe) { reports.push({ ligne, ok: false, titre: r.titre, message: `Axe inconnu : « ${r.axe} »` }); continue; }
      if (!py) { reports.push({ ligne, ok: false, titre: r.titre, message: `Région inconnue : « ${r.pays} »` }); continue; }
      if (!ent) { reports.push({ ligne, ok: false, titre: r.titre, message: `Pôle / partenaire inconnu : « ${r.entite} »` }); continue; }

      const avancement = Math.max(0, Math.min(100, Math.round(toNum(r.avancement) ?? 0)));
      const action = await prisma.action.create({
        data: {
          titre: r.titre,
          planId,
          axeId: axe.id,
          paysId: py.id,
          entiteId: ent.id,
          responsable: r.responsable,
          statut: normStatut(r.statut),
          avancement,
          priorite: normPriorite(r.priorite),
          dateDebut: toDate(r.dateDebut),
          dateFin: toDate(r.dateFin),
          budget: toNum(r.budget),
          commentaire: r.commentaire ?? null,
        },
      });
      await prisma.avancement.create({ data: { actionId: action.id, valeur: avancement, statut: action.statut } });
      created++;
      reports.push({ ligne, ok: true, titre: r.titre });
    }

    // Codification des actions importées + trace d'audit (T0.2 & T0.4).
    if (created > 0) {
      await prisma.$transaction((tx) => reindexerCodesPlan(tx, planId));
    }
    await logAction(
      { action: 'IMPORT', entite: 'Action', entiteId: planId, apres: { planId, created, total: rows.length } },
      req,
    );

    return ok({ created, total: rows.length, errors: reports.filter((r) => !r.ok), reports });
  } catch (e) {
    return handleError(e);
  }
}
