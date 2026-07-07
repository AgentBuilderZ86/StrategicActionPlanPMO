import { prisma } from './prisma';

/**
 * Populations & adoption — accès base. Restitutions toujours agrégées :
 * seuls les pulses respectant le k-anonymat (contrôlé à la saisie) existent.
 */

export type PopulationDTO = {
  id: string;
  nom: string;
  description: string | null;
  effectif: number;
  trancheAge: string;
  ancienneteMoyenne: number | null;
  maturiteDigitale: number;
  expositionChangement: string;
  dernierPulse: {
    date: string;
    adhesion: number;
    comprehension: number;
    preparation: number;
    repondants: number;
  } | null;
  actions: { actionId: string; titre: string; statut: string; niveauImpact: string }[];
};

export async function getPopulations(planId: string): Promise<PopulationDTO[]> {
  const rows = await prisma.population.findMany({
    where: { planId },
    include: {
      pulses: { orderBy: { date: 'desc' }, take: 1 },
      actions: { include: { action: { select: { id: true, titre: true, statut: true } } } },
    },
    orderBy: { nom: 'asc' },
  });
  return rows.map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description,
    effectif: p.effectif,
    trancheAge: p.trancheAge,
    ancienneteMoyenne: p.ancienneteMoyenne,
    maturiteDigitale: p.maturiteDigitale,
    expositionChangement: p.expositionChangement,
    dernierPulse: p.pulses[0]
      ? {
          date: p.pulses[0].date.toISOString(),
          adhesion: p.pulses[0].adhesion,
          comprehension: p.pulses[0].comprehension,
          preparation: p.pulses[0].preparation,
          repondants: p.pulses[0].repondants,
        }
      : null,
    actions: p.actions.map((l) => ({
      actionId: l.action.id,
      titre: l.action.titre,
      statut: l.action.statut,
      niveauImpact: l.niveauImpact,
    })),
  }));
}

export type AdoptionParAction = Map<string, { adhesion: number | null; maturiteDigitale: number | null }>;

/**
 * Signaux d'adoption par action pour le moteur de risque : pour chaque action
 * liée à au moins une population, l'adhésion la plus basse mesurée et la
 * maturité digitale la plus faible parmi les populations impactées.
 */
export async function getAdoptionParAction(planId: string): Promise<AdoptionParAction> {
  const liens = await prisma.actionPopulation.findMany({
    where: { population: { planId } },
    include: {
      population: {
        select: { maturiteDigitale: true, pulses: { orderBy: { date: 'desc' }, take: 1 } },
      },
    },
  });
  const map: AdoptionParAction = new Map();
  for (const l of liens) {
    const adhesion = l.population.pulses[0]?.adhesion ?? null;
    const maturite = l.population.maturiteDigitale;
    const actuel = map.get(l.actionId);
    map.set(l.actionId, {
      adhesion:
        adhesion === null ? (actuel?.adhesion ?? null) : Math.min(adhesion, actuel?.adhesion ?? 100),
      maturiteDigitale: Math.min(maturite, actuel?.maturiteDigitale ?? 5),
    });
  }
  return map;
}
