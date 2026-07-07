import { prisma } from './prisma';
import {
  SEED_DOMAINES,
  champsRequisPour,
  computeDelivery,
  labelStatut,
  nomsANotifier,
  statutInitial,
  transitionAutorisee,
  type IndicateursDelivery,
} from './ppm';
import { notifierRoles, notifierUtilisateurs } from './notifications';

/** PPM DSI — accès base : initiatives, transitions notifiées, indicateurs. */

export type InitiativeDTO = {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  mode: string;
  statutCycle: string;
  domaineId: string | null;
  sousDomaineId: string | null;
  domaine: string | null;
  sousDomaine: string | null;
  valeurMetier: number;
  effortEstime: number | null;
  budget: number | null;
  chefProjet: string | null;
  chefProjetExterne: string | null;
  productOwner: string | null;
  proxyPo: string | null;
  keyUsers: string | null;
  equipeMep: string | null;
  motifGoNoGo: string | null;
  reservesRecette: string | null;
  lot: string | null;
  createdAt: string;
  updatedAt: string;
  transitions: { de: string; vers: string; par: string; commentaire: string | null; createdAt: string }[];
};

const INITIATIVE_INCLUDE = {
  domaine: true,
  sousDomaine: true,
  transitions: { orderBy: { createdAt: 'desc' as const } },
};

function serialize(i: {
  id: string; titre: string; description: string | null; type: string; mode: string;
  statutCycle: string; domaineId: string | null; sousDomaineId: string | null;
  domaine: { nom: string } | null; sousDomaine: { nom: string } | null;
  valeurMetier: number; effortEstime: number | null; budget: number | null;
  chefProjet: string | null; chefProjetExterne: string | null; productOwner: string | null;
  proxyPo: string | null; keyUsers: string | null; equipeMep: string | null;
  motifGoNoGo: string | null; reservesRecette: string | null; lot: string | null;
  createdAt: Date; updatedAt: Date;
  transitions: { de: string; vers: string; par: string; commentaire: string | null; createdAt: Date }[];
}): InitiativeDTO {
  return {
    ...i,
    domaine: i.domaine?.nom ?? null,
    sousDomaine: i.sousDomaine?.nom ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    transitions: i.transitions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };
}

export async function getInitiatives(planId: string): Promise<InitiativeDTO[]> {
  const rows = await prisma.initiative.findMany({
    where: { planId },
    include: INITIATIVE_INCLUDE,
    orderBy: [{ valeurMetier: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map(serialize);
}

export type DomaineDTO = {
  id: string;
  nom: string;
  type: string;
  sousDomaines: { id: string; nom: string }[];
};

/** Référentiel des domaines ; seed NARSA appliqué au premier accès (idempotent). */
export async function getDomaines(planId: string): Promise<DomaineDTO[]> {
  const existants = await prisma.domaine.count({ where: { planId } });
  if (existants === 0) {
    for (const [i, d] of SEED_DOMAINES.entries()) {
      await prisma.domaine.create({
        data: {
          planId,
          nom: d.nom,
          type: d.type,
          ordre: i,
          sousDomaines: { create: d.sousDomaines.map((nom, j) => ({ nom, ordre: j })) },
        },
      });
    }
  }
  const rows = await prisma.domaine.findMany({
    where: { planId },
    include: { sousDomaines: { orderBy: { ordre: 'asc' } } },
    orderBy: { ordre: 'asc' },
  });
  return rows.map((d) => ({
    id: d.id,
    nom: d.nom,
    type: d.type,
    sousDomaines: d.sousDomaines.map((sd) => ({ id: sd.id, nom: sd.nom })),
  }));
}

/** Notifie par correspondance de nom d'utilisateur ; les rôles DSI (ADMIN/PMO)
 *  sont notifiés via leurs rôles applicatifs. Ne bloque jamais l'appelant. */
async function notifierTransition(
  initiative: { id: string; titre: string; mode: string },
  vers: string,
  noms: string[],
  inclureDsi: boolean,
) {
  const payload = {
    type: 'PPM',
    titre: `${initiative.titre} → ${labelStatut(initiative.mode, vers)}`,
    message: null,
    lien: `/pipeline?focus=${initiative.id}`,
  };
  try {
    if (noms.length > 0) {
      const users = await prisma.user.findMany({
        where: { OR: noms.map((n) => ({ name: { equals: n, mode: 'insensitive' as const } })) },
        select: { id: true },
      });
      await notifierUtilisateurs(users.map((u) => u.id), payload);
    }
    if (inclureDsi || noms.length === 0) {
      await notifierRoles(['ADMIN', 'PMO'], payload);
    }
  } catch {
    // les notifications ne doivent jamais faire échouer une transition
  }
}

export type ResultatTransition =
  | { ok: true; initiative: InitiativeDTO; notifies: string[] }
  | { ok: false; code: string; message: string };

/** Transition contrôlée : vérifie le cycle, exige les champs d'étape,
 *  historise et notifie selon la matrice. */
export async function transitionner(
  id: string,
  vers: string,
  par: string,
  extra: { commentaire?: string | null; lot?: string | null; motifGoNoGo?: string | null; reservesRecette?: string | null },
): Promise<ResultatTransition> {
  const existing = await prisma.initiative.findUnique({ where: { id } });
  if (!existing) return { ok: false, code: 'NOT_FOUND', message: 'Initiative introuvable' };

  if (!transitionAutorisee(existing.mode, existing.statutCycle, vers)) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: `Transition ${existing.statutCycle} → ${vers} non autorisée en ${existing.mode}`,
    };
  }

  const data: Record<string, unknown> = { statutCycle: vers };
  for (const { champ, label } of champsRequisPour(vers)) {
    const valeur =
      (extra as Record<string, string | null | undefined>)[champ] ??
      (existing as unknown as Record<string, string | null>)[champ];
    if (!valeur || !String(valeur).trim()) {
      return { ok: false, code: 'VALIDATION', message: `Champ requis pour cette étape : ${label}` };
    }
    data[champ] = String(valeur).trim();
  }

  const updated = await prisma.initiative.update({
    where: { id },
    data: {
      ...data,
      transitions: {
        create: { de: existing.statutCycle, vers, par, commentaire: extra.commentaire ?? null },
      },
    },
    include: INITIATIVE_INCLUDE,
  });

  const { noms, inclureDsi } = nomsANotifier(existing.mode, vers, existing);
  await notifierTransition(existing, vers, noms, inclureDsi);

  return { ok: true, initiative: serialize(updated), notifies: [...noms, ...(inclureDsi ? ['DSI'] : [])] };
}

export async function creerInitiative(
  planId: string,
  input: {
    titre: string; description?: string | null; type: string; mode: string;
    domaineId?: string | null; sousDomaineId?: string | null;
    valeurMetier: number; effortEstime?: number | null; budget?: number | null;
    chefProjet?: string | null; chefProjetExterne?: string | null; productOwner?: string | null;
    proxyPo?: string | null; keyUsers?: string | null; equipeMep?: string | null;
  },
): Promise<InitiativeDTO> {
  const created = await prisma.initiative.create({
    data: { planId, ...input, statutCycle: statutInitial(input.mode) },
    include: INITIATIVE_INCLUDE,
  });
  return serialize(created);
}

export async function getDelivery(planId: string): Promise<IndicateursDelivery & { total: number }> {
  const [initiatives, transitions] = await Promise.all([
    prisma.initiative.findMany({
      where: { planId },
      select: { id: true, mode: true, statutCycle: true, createdAt: true },
    }),
    prisma.transitionCycle.findMany({
      where: { initiative: { planId } },
      select: { initiativeId: true, de: true, vers: true, createdAt: true },
    }),
  ]);
  return { ...computeDelivery(transitions, initiatives), total: initiatives.length };
}

/** Correspondance statut d'action PMO → statut de cycle waterfall. */
const STATUT_ACTION_VERS_CYCLE: Record<string, string> = {
  A_LANCER: 'NON_QUALIFIE',
  EN_COURS: 'REALISATION_EN_COURS',
  BLOQUE: 'REALISATION_EN_COURS',
  TERMINE: 'DEPLOYE',
};

/**
 * Reprise DSI : convertit les actions « PMO stratégique » du plan en
 * initiatives waterfall (titre, description, responsable → chef de projet,
 * budget, statut projeté). Idempotent : une action déjà importée (même titre)
 * est ignorée. Les actions d'origine ne sont pas supprimées.
 */
export async function importerActionsCommeInitiatives(planId: string): Promise<{ importees: number; ignorees: number }> {
  const [actions, initiatives] = await Promise.all([
    prisma.action.findMany({
      where: { planId },
      select: { titre: true, description: true, responsable: true, statut: true, budget: true },
    }),
    prisma.initiative.findMany({ where: { planId }, select: { titre: true } }),
  ]);
  const dejaLa = new Set(initiatives.map((i) => i.titre.trim().toLowerCase()));
  let importees = 0;
  for (const a of actions) {
    if (dejaLa.has(a.titre.trim().toLowerCase())) continue;
    await prisma.initiative.create({
      data: {
        planId,
        titre: a.titre,
        description: a.description,
        type: 'PROJET',
        mode: 'WATERFALL',
        statutCycle: STATUT_ACTION_VERS_CYCLE[a.statut] ?? 'NON_QUALIFIE',
        chefProjet: a.responsable || null,
        budget: a.budget,
      },
    });
    importees++;
  }
  return { importees, ignorees: actions.length - importees };
}
