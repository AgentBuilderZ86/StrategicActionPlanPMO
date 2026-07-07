import { prisma } from './prisma';
import { ACTION_INCLUDE, serializeAction } from './serialize';
import { computeRisques, type FacteurRisque } from './risque';
import { construireDigest, rapprocherAlertes } from './alertes';
import { notifierRoles } from './notifications';
import { getAdoptionParAction } from './populations-db';

/**
 * Synchronise les alertes d'un plan avec l'état du moteur de risque.
 * Idempotent : appelable au chargement de la page /alertes ou par un cron.
 * Notifie ADMIN/PMO à la création d'une alerte CRITIQUE.
 */
export async function synchroniserAlertes(planId: string) {
  const [actionsRaw, existantes, adoption] = await Promise.all([
    prisma.action.findMany({ where: { planId }, include: ACTION_INCLUDE }),
    prisma.alerte.findMany({
      where: { planId },
      select: { id: true, actionId: true, statut: true, score: true },
      orderBy: { updatedAt: 'desc' },
    }),
    getAdoptionParAction(planId),
  ]);

  const risques = computeRisques(
    actionsRaw.map((a) => ({ ...serializeAction(a), adoption: adoption.get(a.id) ?? null })),
  );
  const sync = rapprocherAlertes(existantes, risques);

  const titres = new Map(actionsRaw.map((a) => [a.id, a.titre]));

  // Créations une à une : l'index unique partiel (une alerte ouverte par
  // action) peut rejeter un doublon si deux synchronisations se croisent —
  // on l'ignore, l'autre synchronisation a déjà créé l'alerte.
  let creees = 0;
  for (const c of sync.creer) {
    try {
      await prisma.alerte.create({
        data: {
          planId,
          actionId: c.actionId,
          score: c.score,
          niveau: c.niveau,
          facteurs: JSON.stringify(c.facteurs),
          motif: c.motif ?? null,
        },
      });
      creees++;
    } catch {
      // violation d'unicité : alerte ouverte déjà présente pour cette action
    }
  }

  await prisma.$transaction([
    ...sync.mettreAJour.map((m) =>
      prisma.alerte.update({
        where: { id: m.id },
        data: { score: m.score, niveau: m.niveau, facteurs: JSON.stringify(m.facteurs) },
      }),
    ),
    ...sync.resoudre.map((r) =>
      prisma.alerte.update({
        where: { id: r.id },
        data: { statut: 'RESOLUE', motif: r.motif },
      }),
    ),
  ]);

  const critiques = sync.creer.filter((c) => c.niveau === 'CRITIQUE');
  for (const c of critiques) {
    await notifierRoles(['ADMIN', 'PMO'], {
      type: 'ALERTE',
      titre: `Alerte critique : ${titres.get(c.actionId) ?? 'action'}`,
      message: `Score de risque ${c.score}/100`,
      lien: '/alertes',
    });
  }

  return {
    creees,
    misesAJour: sync.mettreAJour.length,
    resolues: sync.resoudre.length,
  };
}

export type AlerteDTO = {
  id: string;
  actionId: string;
  statut: string;
  score: number;
  niveau: string;
  facteurs: FacteurRisque[];
  motif: string | null;
  createdAt: string;
  updatedAt: string;
  action: { titre: string; axe: string | null; pays: string | null; responsable: string; avancement: number; dateFin: string | null };
};

/** Alertes du plan, les ouvertes d'abord puis par score décroissant. */
export async function getAlertes(planId: string): Promise<AlerteDTO[]> {
  const rows = await prisma.alerte.findMany({
    where: { planId },
    include: { action: { include: ACTION_INCLUDE } },
    orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map((a) => {
    let facteurs: FacteurRisque[] = [];
    try {
      facteurs = JSON.parse(a.facteurs) as FacteurRisque[];
    } catch {
      facteurs = [];
    }
    return {
      id: a.id,
      actionId: a.actionId,
      statut: a.statut,
      score: a.score,
      niveau: a.niveau,
      facteurs,
      motif: a.motif,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      action: {
        titre: a.action.titre,
        axe: a.action.axe?.nom ?? null,
        pays: a.action.pays?.nom ?? null,
        responsable: a.action.responsable,
        avancement: a.action.avancement,
        dateFin: a.action.dateFin ? a.action.dateFin.toISOString() : null,
      },
    };
  });
}

/** Envoie le digest des alertes ouvertes aux ADMIN/PMO. Renvoie true si envoyé. */
export async function envoyerDigest(planId: string): Promise<boolean> {
  const alertes = await getAlertes(planId);
  const digest = construireDigest(
    alertes.map((a) => ({ score: a.score, niveau: a.niveau, statut: a.statut, titre: a.action.titre })),
  );
  if (!digest) return false;
  await notifierRoles(['ADMIN', 'PMO'], {
    type: 'ALERTE',
    titre: digest.titre,
    message: digest.message,
    lien: '/alertes',
  });
  return true;
}
