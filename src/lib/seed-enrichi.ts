import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_DOMAINES } from './ppm';

/**
 * Enrichissement du jeu de démonstration (dette #7) : peuple TOUS les modules
 * récents pour des démos et tests réalistes — signaux du moteur de risque,
 * populations & pulses, portefeuille PPM DSI avec historique de transitions
 * daté (lead times, TTD, throughput, souffrance), utilisateurs de rôles.
 * Déterministe : mêmes données à chaque exécution.
 */

const JOUR = 86_400_000;
const ilYA = (jours: number) => new Date(Date.now() - jours * JOUR);

// Chemins de cycle : la position dans la liste détermine l'historique généré.
const CHEMIN_WF = ['NON_QUALIFIE', 'QUALIFIE', 'GO_NOGO', 'A_SPECIFIER_DSI', 'A_SPECIFIER_METIER', 'A_VALIDER', 'A_REALISER', 'REALISATION_EN_COURS', 'RECETTE_EN_COURS', 'RECETTE_VALIDEE', 'A_DEPLOYER', 'DEPLOYE'];
const CHEMIN_AGILE = ['BACKLOG', 'AFFINE', 'PRET', 'EN_SPRINT', 'EN_REVUE', 'RECETTE_METIER', 'TERMINE', 'DEPLOYE'];

type IniSeed = {
  titre: string;
  mode: 'WATERFALL' | 'AGILE';
  statut: string;
  domaine: string; // nom du domaine
  sousDomaine: string;
  valeur: number;
  budget: number | null;
  ageJours: number; // ancienneté de la soumission
  pasJours: number; // durée moyenne par étape (variété des lead times)
  lot?: string;
  allerRetourRecette?: boolean; // waterfall : passage par RECETTE_NON_VALIDEE
  type?: 'INITIATIVE' | 'PROJET';
};

const ROLES_DEFAUT = {
  chefProjet: 'Mehdi El Fassi',
  chefProjetExterne: 'Atos — L. Garnier',
  productOwner: 'Salma Benjelloun',
  proxyPo: 'Hicham Cherkaoui',
  keyUsers: 'Karim Alaoui; Rim Tazi',
  equipeMep: 'Prod & Exploitation',
};

const INITIATIVES: IniSeed[] = [
  // Backlog / qualification (dont une vieille : âge du backlog visible)
  { titre: 'Portail auto-écoles v2', mode: 'WATERFALL', statut: 'NON_QUALIFIE', domaine: 'Support', sousDomaine: 'Relation usager', valeur: 3, budget: null, ageJours: 45, pasJours: 0 },
  { titre: 'API échange DGSN (infractions)', mode: 'WATERFALL', statut: 'NON_QUALIFIE', domaine: 'Cœur métier', sousDomaine: 'Contrôle & sanctions (radars)', valeur: 4, budget: null, ageJours: 12, pasJours: 0 },
  { titre: 'Dématérialisation des PV', mode: 'WATERFALL', statut: 'QUALIFIE', domaine: 'Cœur métier', sousDomaine: 'Contrôle & sanctions (radars)', valeur: 5, budget: 2500, ageJours: 30, pasJours: 12 },
  { titre: 'Data lake accidentologie', mode: 'WATERFALL', statut: 'GO_NOGO', domaine: 'Pilotage', sousDomaine: 'Data & décisionnel', valeur: 4, budget: 4200, ageJours: 40, pasJours: 14 },
  // NoGo motivé (pipeline honnête)
  { titre: 'Refonte GED interne', mode: 'WATERFALL', statut: 'NOGO', domaine: 'Support', sousDomaine: 'IT interne & infrastructure', valeur: 2, budget: 800, ageJours: 90, pasJours: 10 },
  // Conception — dont une en souffrance chez le métier (> 21 j immobile)
  { titre: 'App mobile contrôleurs terrain', mode: 'WATERFALL', statut: 'A_SPECIFIER_DSI', domaine: 'Cœur métier', sousDomaine: 'Contrôle & sanctions (radars)', valeur: 5, budget: 3800, ageJours: 55, pasJours: 9 },
  { titre: 'Téléservice duplicata carte grise', mode: 'WATERFALL', statut: 'A_SPECIFIER_METIER', domaine: 'Cœur métier', sousDomaine: 'Immatriculation', valeur: 4, budget: 1900, ageJours: 95, pasJours: 15 },
  { titre: 'SIRH — module congés', mode: 'WATERFALL', statut: 'A_VALIDER', domaine: 'Support', sousDomaine: 'RH', valeur: 2, budget: 600, ageJours: 70, pasJours: 9 },
  // Réalisation
  { titre: 'Interconnexion SAMU — alerte post-accident', mode: 'WATERFALL', statut: 'A_REALISER', domaine: 'Cœur métier', sousDomaine: 'Secours & post-accident', valeur: 5, budget: 5200, ageJours: 85, pasJours: 10, type: 'PROJET' },
  { titre: 'Refonte portail immatriculation en ligne', mode: 'WATERFALL', statut: 'REALISATION_EN_COURS', domaine: 'Cœur métier', sousDomaine: 'Immatriculation', valeur: 5, budget: 6100, ageJours: 130, pasJours: 13, type: 'PROJET' },
  { titre: 'Portail achats & marchés', mode: 'WATERFALL', statut: 'REALISATION_EN_COURS', domaine: 'Support', sousDomaine: 'Achats & moyens généraux', valeur: 2, budget: 900, ageJours: 75, pasJours: 8 },
  // Recette — dont un aller-retour (taux 1er coup < 100 %)
  { titre: 'Permis à points v2', mode: 'WATERFALL', statut: 'RECETTE_EN_COURS', domaine: 'Cœur métier', sousDomaine: 'Permis de conduire', valeur: 4, budget: 3400, ageJours: 150, pasJours: 14, type: 'PROJET' },
  { titre: 'CRM réclamations usagers', mode: 'WATERFALL', statut: 'RECETTE_VALIDEE', domaine: 'Support', sousDomaine: 'Relation usager', valeur: 3, budget: 1400, ageJours: 160, pasJours: 13, allerRetourRecette: true },
  // Déploiement + déployées (throughput & TTD sur 6 mois)
  { titre: 'Signature électronique interne', mode: 'WATERFALL', statut: 'A_DEPLOYER', domaine: 'Pilotage', sousDomaine: 'Juridique & conformité', valeur: 3, budget: 700, ageJours: 120, pasJours: 10, lot: 'Lot 2026-07' },
  { titre: 'Paiement en ligne des amendes', mode: 'WATERFALL', statut: 'DEPLOYE', domaine: 'Cœur métier', sousDomaine: 'Contrôle & sanctions (radars)', valeur: 5, budget: 2800, ageJours: 210, pasJours: 16, lot: 'Lot 2026-05', type: 'PROJET' },
  { titre: 'Prise de rendez-vous contrôle technique', mode: 'WATERFALL', statut: 'DEPLOYE', domaine: 'Cœur métier', sousDomaine: 'Contrôle technique', valeur: 4, budget: 1600, ageJours: 170, pasJours: 12, lot: 'Lot 2026-06' },
  // Agile
  { titre: 'Chatbot usagers (FAQ intelligente)', mode: 'AGILE', statut: 'BACKLOG', domaine: 'Support', sousDomaine: 'Relation usager', valeur: 3, budget: null, ageJours: 20, pasJours: 0 },
  { titre: 'Tableau de bord DG temps réel', mode: 'AGILE', statut: 'AFFINE', domaine: 'Pilotage', sousDomaine: 'Stratégie & gouvernance', valeur: 4, budget: 500, ageJours: 35, pasJours: 10 },
  { titre: 'App vérification terrain (agents)', mode: 'AGILE', statut: 'PRET', domaine: 'Cœur métier', sousDomaine: 'Contrôle & sanctions (radars)', valeur: 4, budget: 750, ageJours: 45, pasJours: 11 },
  { titre: 'Portail data interne (self-service BI)', mode: 'AGILE', statut: 'EN_SPRINT', domaine: 'Pilotage', sousDomaine: 'Data & décisionnel', valeur: 4, budget: 1200, ageJours: 60, pasJours: 10 },
  { titre: 'Notifications usagers multicanal', mode: 'AGILE', statut: 'EN_REVUE', domaine: 'Support', sousDomaine: 'Relation usager', valeur: 3, budget: 400, ageJours: 65, pasJours: 9 },
  { titre: 'e-Permis — parcours candidat', mode: 'AGILE', statut: 'RECETTE_METIER', domaine: 'Cœur métier', sousDomaine: 'Permis de conduire', valeur: 5, budget: 2100, ageJours: 100, pasJours: 12 },
  { titre: 'SSO interne (annuaire unifié)', mode: 'AGILE', statut: 'DEPLOYE', domaine: 'Support', sousDomaine: 'IT interne & infrastructure', valeur: 2, budget: 350, ageJours: 140, pasJours: 11, lot: 'R-2026.06' },
];

export async function seedEnrichi(
  prisma: PrismaClient,
  planSnsrId: string,
  planSiId: string,
): Promise<{ populations: number; pulses: number; initiatives: number; transitions: number }> {
  // ── Utilisateurs incarnant les rôles PPM (notifications par nom) ─────────
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const rolesUsers = [
    { email: 'cp.dsi@narsa.ma', name: 'Mehdi El Fassi', role: 'PMO' },
    { email: 'po.metier@narsa.ma', name: 'Salma Benjelloun', role: 'CONTRIBUTEUR' },
    { email: 'proxy.po@narsa.ma', name: 'Hicham Cherkaoui', role: 'CONTRIBUTEUR' },
    { email: 'keyuser1@narsa.ma', name: 'Karim Alaoui', role: 'CONTRIBUTEUR' },
    { email: 'keyuser2@narsa.ma', name: 'Rim Tazi', role: 'CONTRIBUTEUR' },
  ];
  for (const u of rolesUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash },
      create: { ...u, passwordHash },
    });
  }

  // ── Signaux du moteur de risque sur le plan SNSR ──────────────────────────
  const actionsSnsr = await prisma.action.findMany({
    where: { planId: planSnsrId, statut: 'EN_COURS', niveau: { gte: 3 } },
    orderBy: { titre: 'asc' },
    take: 8,
    select: { id: true, budget: true },
  });
  // Confiance faible déclarée au check-in (facteur CONFIANCE)
  for (const a of actionsSnsr.slice(0, 3)) {
    await prisma.action.update({ where: { id: a.id }, data: { confiance: 2 } });
  }
  // Burn budgétaire décorrélé (facteur BUDGET)
  for (const a of actionsSnsr.slice(3, 5)) {
    if (a.budget) {
      await prisma.action.update({
        where: { id: a.id },
        data: { budgetConso: Math.round(a.budget * 0.85), avancement: 30 },
      });
    }
  }

  // ── Populations & pulses (plan SNSR) ──────────────────────────────────────
  await prisma.pulse.deleteMany({ where: { population: { planId: planSnsrId } } });
  await prisma.population.deleteMany({ where: { planId: planSnsrId } });
  const populationsData = [
    {
      nom: 'Agents guichet région Nord', effectif: 240, trancheAge: 'PLUS_50',
      ancienneteMoyenne: 16, maturiteDigitale: 2, expositionChangement: 'FORTE',
      pulses: [
        { jours: 45, adhesion: 58, comprehension: 62, preparation: 50, repondants: 64 },
        { jours: 10, adhesion: 41, comprehension: 55, preparation: 35, repondants: 71 },
      ],
    },
    {
      nom: 'Conseillers clientèle', effectif: 115, trancheAge: 'ENTRE_35_50',
      ancienneteMoyenne: 8, maturiteDigitale: 3, expositionChangement: 'MOYENNE',
      pulses: [{ jours: 10, adhesion: 63, comprehension: 70, preparation: 58, repondants: 42 }],
    },
    {
      nom: 'Contrôleurs routiers', effectif: 310, trancheAge: 'MIXTE',
      ancienneteMoyenne: 12, maturiteDigitale: 3, expositionChangement: 'FORTE',
      pulses: [{ jours: 18, adhesion: 57, comprehension: 61, preparation: 49, repondants: 96 }],
    },
    {
      nom: 'Équipes DSI', effectif: 85, trancheAge: 'MOINS_35',
      ancienneteMoyenne: 4, maturiteDigitale: 4, expositionChangement: 'MOYENNE',
      pulses: [{ jours: 10, adhesion: 79, comprehension: 84, preparation: 72, repondants: 38 }],
    },
  ];
  let nbPulses = 0;
  const actionsALier = await prisma.action.findMany({
    where: { planId: planSnsrId, niveau: { gte: 3 } },
    orderBy: { titre: 'asc' },
    take: 10,
    select: { id: true },
  });
  let cursorLien = 0;
  for (const p of populationsData) {
    const { pulses, ...profil } = p;
    const pop = await prisma.population.create({ data: { ...profil, planId: planSnsrId } });
    for (const pl of pulses) {
      const { jours, ...valeurs } = pl;
      await prisma.pulse.create({ data: { ...valeurs, populationId: pop.id, date: ilYA(jours) } });
      nbPulses++;
    }
    // 2-3 actions liées par population, impacts variés
    const impacts = ['TRANSFORME', 'FORME', 'INFORME'];
    for (let k = 0; k < 3 && cursorLien < actionsALier.length; k++, cursorLien++) {
      await prisma.actionPopulation.create({
        data: {
          populationId: pop.id,
          actionId: actionsALier[cursorLien]!.id,
          niveauImpact: impacts[k % 3]!,
        },
      });
    }
  }

  // ── PPM DSI : domaines, initiatives, historique de transitions ───────────
  await prisma.transitionCycle.deleteMany({ where: { initiative: { planId: planSiId } } });
  await prisma.initiative.deleteMany({ where: { planId: planSiId } });
  await prisma.sousDomaine.deleteMany({ where: { domaine: { planId: planSiId } } });
  await prisma.domaine.deleteMany({ where: { planId: planSiId } });

  const sousDomaineIds = new Map<string, { domaineId: string; sousDomaineId: string }>();
  for (const [i, d] of SEED_DOMAINES.entries()) {
    const dom = await prisma.domaine.create({
      data: { planId: planSiId, nom: d.nom, type: d.type, ordre: i },
    });
    for (const [j, nomSd] of d.sousDomaines.entries()) {
      const sd = await prisma.sousDomaine.create({
        data: { domaineId: dom.id, nom: nomSd, ordre: j },
      });
      sousDomaineIds.set(`${d.nom}/${nomSd}`, { domaineId: dom.id, sousDomaineId: sd.id });
    }
  }

  let nbTransitions = 0;
  for (const seed of INITIATIVES) {
    const chemin = seed.mode === 'AGILE' ? CHEMIN_AGILE : CHEMIN_WF;
    // Chemin effectif jusqu'au statut cible (NOGO : bifurcation après GO_NOGO).
    let etapes: string[];
    if (seed.statut === 'NOGO') {
      etapes = ['NON_QUALIFIE', 'QUALIFIE', 'GO_NOGO', 'NOGO'];
    } else {
      const idx = chemin.indexOf(seed.statut);
      etapes = chemin.slice(0, idx + 1);
      if (seed.allerRetourRecette) {
        const i = etapes.indexOf('RECETTE_VALIDEE');
        if (i > -1) {
          etapes = [
            ...etapes.slice(0, i),
            'RECETTE_NON_VALIDEE', 'REALISATION_EN_COURS', 'RECETTE_EN_COURS',
            ...etapes.slice(i),
          ];
        }
      }
    }

    const refs = sousDomaineIds.get(`${seed.domaine}/${seed.sousDomaine}`);
    const creation = ilYA(seed.ageJours);
    const initiative = await prisma.initiative.create({
      data: {
        planId: planSiId,
        titre: seed.titre,
        description: `Initiative de démonstration — ${seed.domaine} / ${seed.sousDomaine}.`,
        type: seed.type ?? 'INITIATIVE',
        mode: seed.mode,
        statutCycle: seed.statut,
        domaineId: refs?.domaineId ?? null,
        sousDomaineId: refs?.sousDomaineId ?? null,
        valeurMetier: seed.valeur,
        budget: seed.budget,
        effortEstime: seed.budget ? Math.round(seed.budget / 12) : null,
        lot: seed.lot ?? null,
        motifGoNoGo: etapes.includes('A_SPECIFIER_DSI')
          ? 'GO comité DSI-métier : valeur confirmée, budget cadré.'
          : seed.statut === 'NOGO'
            ? 'NoGo : valeur insuffisante au regard du coût, à revoir en 2027.'
            : null,
        reservesRecette: seed.allerRetourRecette
          ? 'Réserves levées après correctif : écarts sur les états de sortie.'
          : null,
        ...ROLES_DEFAUT,
        createdAt: creation,
      },
    });

    // Historique daté : chaque étape espacée de pasJours (lead times réalistes).
    let horloge = seed.ageJours;
    for (let k = 1; k < etapes.length; k++) {
      horloge -= seed.pasJours;
      const quand = ilYA(Math.max(1, horloge));
      await prisma.transitionCycle.create({
        data: {
          initiativeId: initiative.id,
          de: etapes[k - 1]!,
          vers: etapes[k]!,
          par: k % 2 === 0 ? 'Salma Benjelloun' : 'Mehdi El Fassi',
          commentaire: etapes[k] === 'DEPLOYE' ? `Mise en production ${seed.lot ?? ''}`.trim() : null,
          createdAt: quand,
        },
      });
      nbTransitions++;
    }
    // updatedAt cohérent avec la dernière transition (souffrance mesurable).
    const derniere = seed.ageJours - (etapes.length - 1) * seed.pasJours;
    await prisma.initiative.update({
      where: { id: initiative.id },
      data: { updatedAt: ilYA(Math.max(1, derniere)) },
    });
  }

  return {
    populations: populationsData.length,
    pulses: nbPulses,
    initiatives: INITIATIVES.length,
    transitions: nbTransitions,
  };
}
