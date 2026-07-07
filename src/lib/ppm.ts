/**
 * PPM DSI — logique pure : cycles de vie Waterfall et Agile, transitions
 * contrôlées, champs requis par étape, matrice de notifications par rôle,
 * indicateurs de delivery (lead times). Aucune dépendance base, testable.
 */

export const MODES = ['WATERFALL', 'AGILE'] as const;
export type ModeDelivery = (typeof MODES)[number];

export const TYPES_INITIATIVE = ['INITIATIVE', 'PROJET'] as const;

export const DOMAINE_TYPES = ['PILOTAGE', 'COEUR_METIER', 'SUPPORT'] as const;
export const DOMAINE_TYPE_LABEL: Record<string, string> = {
  PILOTAGE: 'Pilotage',
  COEUR_METIER: 'Cœur métier',
  SUPPORT: 'Support',
};

// ---------------------------------------------------------------------------
// Cycles de vie
// ---------------------------------------------------------------------------

export type EtapeCycle = {
  statut: string;
  label: string;
  phase: string;
};

export const CYCLE_WATERFALL: EtapeCycle[] = [
  { statut: 'NON_QUALIFIE', label: 'Non qualifié', phase: 'Qualification' },
  { statut: 'QUALIFIE', label: 'Qualifié', phase: 'Qualification' },
  { statut: 'GO_NOGO', label: 'Go / NoGo', phase: 'Qualification' },
  { statut: 'A_SPECIFIER_DSI', label: 'À spécifier DSI', phase: 'Conception' },
  { statut: 'A_SPECIFIER_METIER', label: 'À spécifier métier', phase: 'Conception' },
  { statut: 'A_VALIDER', label: 'À valider', phase: 'Conception' },
  { statut: 'A_REALISER', label: 'À réaliser', phase: 'Réalisation' },
  { statut: 'REALISATION_EN_COURS', label: 'Réalisation en cours', phase: 'Réalisation' },
  { statut: 'RECETTE_EN_COURS', label: 'Recette en cours', phase: 'Recette' },
  { statut: 'RECETTE_VALIDEE', label: 'Recette validée', phase: 'Recette' },
  { statut: 'RECETTE_NON_VALIDEE', label: 'Recette non validée', phase: 'Recette' },
  { statut: 'A_DEPLOYER', label: 'À déployer', phase: 'Déploiement' },
  { statut: 'DEPLOYE', label: 'Déployé', phase: 'Déploiement' },
  { statut: 'NOGO', label: 'NoGo (clôturée)', phase: 'Qualification' },
];

export const CYCLE_AGILE: EtapeCycle[] = [
  { statut: 'BACKLOG', label: 'Backlog', phase: 'Cadrage' },
  { statut: 'AFFINE', label: 'Affiné', phase: 'Cadrage' },
  { statut: 'PRET', label: 'Prêt', phase: 'Cadrage' },
  { statut: 'EN_SPRINT', label: 'En sprint', phase: 'Delivery' },
  { statut: 'EN_REVUE', label: 'En revue', phase: 'Delivery' },
  { statut: 'RECETTE_METIER', label: 'Recette métier (UAT)', phase: 'Recette' },
  { statut: 'TERMINE', label: 'Terminé', phase: 'Déploiement' },
  { statut: 'DEPLOYE', label: 'Déployé', phase: 'Déploiement' },
];

export function cyclePourMode(mode: string): EtapeCycle[] {
  return mode === 'AGILE' ? CYCLE_AGILE : CYCLE_WATERFALL;
}

export function labelStatut(mode: string, statut: string): string {
  return cyclePourMode(mode).find((e) => e.statut === statut)?.label ?? statut;
}

export function statutInitial(mode: string): string {
  return mode === 'AGILE' ? 'BACKLOG' : 'NON_QUALIFIE';
}

/** Statuts terminaux : le time to delivery s'y mesure. */
export const STATUTS_TERMINES = ['DEPLOYE', 'NOGO'];

// Transitions autorisées par mode. La recette non validée renvoie en
// réalisation (waterfall) ou en sprint (agile).
const TRANSITIONS_WF: Record<string, string[]> = {
  NON_QUALIFIE: ['QUALIFIE'],
  QUALIFIE: ['GO_NOGO'],
  GO_NOGO: ['A_SPECIFIER_DSI', 'NOGO'],
  A_SPECIFIER_DSI: ['A_SPECIFIER_METIER'],
  A_SPECIFIER_METIER: ['A_VALIDER'],
  A_VALIDER: ['A_REALISER', 'A_SPECIFIER_METIER'],
  A_REALISER: ['REALISATION_EN_COURS'],
  REALISATION_EN_COURS: ['RECETTE_EN_COURS'],
  RECETTE_EN_COURS: ['RECETTE_VALIDEE', 'RECETTE_NON_VALIDEE'],
  RECETTE_VALIDEE: ['A_DEPLOYER'],
  RECETTE_NON_VALIDEE: ['REALISATION_EN_COURS'],
  A_DEPLOYER: ['DEPLOYE'],
  DEPLOYE: [],
  NOGO: [],
};

const TRANSITIONS_AGILE: Record<string, string[]> = {
  BACKLOG: ['AFFINE'],
  AFFINE: ['PRET', 'BACKLOG'],
  PRET: ['EN_SPRINT'],
  EN_SPRINT: ['EN_REVUE'],
  EN_REVUE: ['RECETTE_METIER', 'EN_SPRINT'],
  RECETTE_METIER: ['TERMINE', 'EN_SPRINT'],
  TERMINE: ['DEPLOYE'],
  DEPLOYE: [],
};

export function transitionsPossibles(mode: string, statut: string): string[] {
  const table = mode === 'AGILE' ? TRANSITIONS_AGILE : TRANSITIONS_WF;
  return table[statut] ?? [];
}

export function transitionAutorisee(mode: string, de: string, vers: string): boolean {
  return transitionsPossibles(mode, de).includes(vers);
}

/** Champs exigés à l'entrée de certains statuts (renseignement par étape). */
export function champsRequisPour(vers: string): { champ: string; label: string }[] {
  switch (vers) {
    case 'NOGO':
      return [{ champ: 'motifGoNoGo', label: 'Motif de la décision NoGo' }];
    case 'A_SPECIFIER_DSI':
      return [{ champ: 'motifGoNoGo', label: 'Décision GO : périmètre / motif' }];
    case 'RECETTE_NON_VALIDEE':
      return [{ champ: 'reservesRecette', label: 'Réserves de recette (obligatoires)' }];
    case 'A_DEPLOYER':
      return [{ champ: 'lot', label: 'Numéro de lot / release' }];
    case 'DEPLOYE':
      return [{ champ: 'lot', label: 'Numéro de lot / release' }];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Matrice de notifications : qui prévenir à l'ENTRÉE de chaque statut.
// ---------------------------------------------------------------------------

export type RoleInitiative =
  | 'DSI'
  | 'CHEF_PROJET'
  | 'PRODUCT_OWNER'
  | 'PROXY_PO'
  | 'KEY_USERS'
  | 'EQUIPE_MEP';

export const ROLE_INITIATIVE_LABEL: Record<RoleInitiative, string> = {
  DSI: 'DSI (PMO)',
  CHEF_PROJET: 'Chef de projet (interne/externe)',
  PRODUCT_OWNER: 'Product Owner',
  PROXY_PO: 'Proxy Product Owner',
  KEY_USERS: 'Key users',
  EQUIPE_MEP: 'Équipe mise en production',
};

const MATRICE_WF: Record<string, RoleInitiative[]> = {
  QUALIFIE: ['DSI'],
  GO_NOGO: ['DSI', 'PRODUCT_OWNER'],
  A_SPECIFIER_DSI: ['CHEF_PROJET'],
  A_SPECIFIER_METIER: ['PRODUCT_OWNER', 'PROXY_PO'],
  A_VALIDER: ['PRODUCT_OWNER', 'PROXY_PO', 'DSI'],
  A_REALISER: ['CHEF_PROJET'],
  REALISATION_EN_COURS: ['CHEF_PROJET'],
  RECETTE_EN_COURS: ['KEY_USERS', 'PRODUCT_OWNER', 'PROXY_PO'],
  RECETTE_VALIDEE: ['CHEF_PROJET', 'DSI'],
  RECETTE_NON_VALIDEE: ['CHEF_PROJET', 'DSI', 'PRODUCT_OWNER'],
  A_DEPLOYER: ['EQUIPE_MEP'],
  DEPLOYE: ['EQUIPE_MEP', 'PRODUCT_OWNER', 'DSI'],
  NOGO: ['DSI', 'PRODUCT_OWNER'],
};

const MATRICE_AGILE: Record<string, RoleInitiative[]> = {
  AFFINE: ['PRODUCT_OWNER'],
  PRET: ['CHEF_PROJET'],
  EN_SPRINT: ['CHEF_PROJET'],
  EN_REVUE: ['PRODUCT_OWNER', 'PROXY_PO'],
  RECETTE_METIER: ['KEY_USERS', 'PRODUCT_OWNER', 'PROXY_PO'],
  TERMINE: ['DSI', 'PRODUCT_OWNER'],
  DEPLOYE: ['EQUIPE_MEP', 'PRODUCT_OWNER', 'DSI'],
};

export function rolesANotifier(mode: string, vers: string): RoleInitiative[] {
  const table = mode === 'AGILE' ? MATRICE_AGILE : MATRICE_WF;
  return table[vers] ?? [];
}

export type RolesInitiative = {
  chefProjet?: string | null;
  chefProjetExterne?: string | null;
  productOwner?: string | null;
  proxyPo?: string | null;
  keyUsers?: string | null;
  equipeMep?: string | null;
};

/** Noms (libres) à notifier pour une transition — le rôle DSI est géré à part
 *  (notification aux profils ADMIN/PMO). */
export function nomsANotifier(mode: string, vers: string, roles: RolesInitiative): {
  noms: string[];
  inclureDsi: boolean;
} {
  const cibles = rolesANotifier(mode, vers);
  const noms = new Set<string>();
  for (const role of cibles) {
    if (role === 'CHEF_PROJET') {
      if (roles.chefProjet) noms.add(roles.chefProjet);
      if (roles.chefProjetExterne) noms.add(roles.chefProjetExterne);
    }
    if (role === 'PRODUCT_OWNER' && roles.productOwner) noms.add(roles.productOwner);
    if (role === 'PROXY_PO' && roles.proxyPo) noms.add(roles.proxyPo);
    if (role === 'KEY_USERS' && roles.keyUsers) {
      roles.keyUsers.split(/[;,]/).map((k) => k.trim()).filter(Boolean).forEach((k) => noms.add(k));
    }
    if (role === 'EQUIPE_MEP' && roles.equipeMep) noms.add(roles.equipeMep);
  }
  return { noms: [...noms], inclureDsi: cibles.includes('DSI') };
}

// ---------------------------------------------------------------------------
// Indicateurs de delivery
// ---------------------------------------------------------------------------

export type TransitionHisto = {
  initiativeId: string;
  de: string;
  vers: string;
  createdAt: Date | string;
};

export type InitiativeLight = {
  id: string;
  mode: string;
  statutCycle: string;
  createdAt: Date | string;
};

const JOUR = 86_400_000;
const t = (d: Date | string) => new Date(d).getTime();

/** Durée moyenne passée dans chaque statut (jours), à partir de l'historique. */
export function leadTimeParStatut(
  transitions: TransitionHisto[],
  initiatives: InitiativeLight[],
  today: Date = new Date(),
): Map<string, number> {
  const parInitiative = new Map<string, TransitionHisto[]>();
  for (const tr of transitions) {
    if (!parInitiative.has(tr.initiativeId)) parInitiative.set(tr.initiativeId, []);
    parInitiative.get(tr.initiativeId)!.push(tr);
  }
  const durees = new Map<string, number[]>();
  const pousser = (statut: string, jours: number) => {
    if (!durees.has(statut)) durees.set(statut, []);
    durees.get(statut)!.push(jours);
  };
  for (const ini of initiatives) {
    const histo = [...(parInitiative.get(ini.id) ?? [])].sort((a, b) => t(a.createdAt) - t(b.createdAt));
    let statut = histo[0]?.de ?? ini.statutCycle;
    let depuis = t(ini.createdAt);
    for (const tr of histo) {
      pousser(statut, (t(tr.createdAt) - depuis) / JOUR);
      statut = tr.vers;
      depuis = t(tr.createdAt);
    }
    if (!STATUTS_TERMINES.includes(statut)) {
      pousser(statut, (today.getTime() - depuis) / JOUR);
    }
  }
  const moyennes = new Map<string, number>();
  for (const [statut, valeurs] of durees) {
    moyennes.set(statut, Math.round((valeurs.reduce((s, v) => s + v, 0) / valeurs.length) * 10) / 10);
  }
  return moyennes;
}

export type IndicateursDelivery = {
  timeToDeliveryMedianJours: number | null;
  throughputParMois: number;
  tauxRecetteOkPremierCoup: number | null;
  wipParStatut: Map<string, number>;
  ageMoyenBacklogJours: number | null;
  leadTimes: Map<string, number>;
};

export function computeDelivery(
  transitions: TransitionHisto[],
  initiatives: InitiativeLight[],
  today: Date = new Date(),
): IndicateursDelivery {
  // Time to delivery : création → première transition vers DEPLOYE.
  const deploiements = transitions.filter((tr) => tr.vers === 'DEPLOYE');
  const creations = new Map(initiatives.map((i) => [i.id, t(i.createdAt)]));
  const ttds = deploiements
    .map((tr) => (creations.has(tr.initiativeId) ? (t(tr.createdAt) - creations.get(tr.initiativeId)!) / JOUR : null))
    .filter((v): v is number => v !== null && v >= 0)
    .sort((a, b) => a - b);
  const mediane = ttds.length ? Math.round(ttds[Math.floor((ttds.length - 1) / 2)]!) : null;

  // Throughput : déployées / mois sur les 6 derniers mois.
  const seuil6mois = today.getTime() - 182 * JOUR;
  const recents = deploiements.filter((tr) => t(tr.createdAt) >= seuil6mois);
  const throughput = Math.round((recents.length / 6) * 10) / 10;

  // Recette OK du premier coup (waterfall) : validée sans passage préalable en non validée.
  const parIni = new Map<string, TransitionHisto[]>();
  for (const tr of transitions) {
    if (!parIni.has(tr.initiativeId)) parIni.set(tr.initiativeId, []);
    parIni.get(tr.initiativeId)!.push(tr);
  }
  let recettesOk = 0;
  let recettesTotal = 0;
  for (const histo of parIni.values()) {
    const aValide = histo.some((tr) => tr.vers === 'RECETTE_VALIDEE');
    if (!aValide) continue;
    recettesTotal++;
    if (!histo.some((tr) => tr.vers === 'RECETTE_NON_VALIDEE')) recettesOk++;
  }
  const tauxRecette = recettesTotal ? Math.round((recettesOk / recettesTotal) * 100) : null;

  // WIP par statut (hors terminés).
  const wip = new Map<string, number>();
  for (const i of initiatives) {
    if (STATUTS_TERMINES.includes(i.statutCycle)) continue;
    wip.set(i.statutCycle, (wip.get(i.statutCycle) ?? 0) + 1);
  }

  // Âge moyen du backlog non qualifié.
  const backlog = initiatives.filter((i) => i.statutCycle === 'NON_QUALIFIE' || i.statutCycle === 'BACKLOG');
  const age = backlog.length
    ? Math.round(backlog.reduce((s, i) => s + (today.getTime() - t(i.createdAt)) / JOUR, 0) / backlog.length)
    : null;

  return {
    timeToDeliveryMedianJours: mediane,
    throughputParMois: throughput,
    tauxRecetteOkPremierCoup: tauxRecette,
    wipParStatut: wip,
    ageMoyenBacklogJours: age,
    leadTimes: leadTimeParStatut(transitions, initiatives, today),
  };
}

// ---------------------------------------------------------------------------
// Référentiel de domaines — seed NARSA (éditable ensuite dans l'app).
// ---------------------------------------------------------------------------

export const SEED_DOMAINES: { nom: string; type: string; sousDomaines: string[] }[] = [
  { nom: 'Pilotage', type: 'PILOTAGE', sousDomaines: ['Stratégie & gouvernance', 'Data & décisionnel', 'Finance & budget', 'Juridique & conformité'] },
  { nom: 'Cœur métier', type: 'COEUR_METIER', sousDomaines: ['Immatriculation', 'Permis de conduire', 'Contrôle technique', 'Contrôle & sanctions (radars)', 'Éducation routière', 'Secours & post-accident'] },
  { nom: 'Support', type: 'SUPPORT', sousDomaines: ['RH', 'Achats & moyens généraux', 'Relation usager', 'IT interne & infrastructure'] },
];

// ---------------------------------------------------------------------------
// Tableau de bord DSI — agrégations pures
// ---------------------------------------------------------------------------

export const PHASES_WF = ['Qualification', 'Conception', 'Réalisation', 'Recette', 'Déploiement'];

export function phaseDuStatut(mode: string, statut: string): string {
  return cyclePourMode(mode).find((e) => e.statut === statut)?.phase ?? 'Qualification';
}

export type CelluleDomainePhase = { phase: string; count: number };
export type LigneDomainePhase = { domaine: string; total: number; cellules: CelluleDomainePhase[] };

/** Matrice domaines métiers × phases du cycle (l'équivalent DSI de la
 *  heatmap région × axe du PMO stratégique). */
export function matriceDomainePhase(
  initiatives: { domaine?: string | null; mode: string; statutCycle: string }[],
): LigneDomainePhase[] {
  const actives = initiatives.filter((i) => !STATUTS_TERMINES.includes(i.statutCycle));
  const parDomaine = new Map<string, Map<string, number>>();
  for (const i of actives) {
    const dom = i.domaine ?? 'Sans domaine';
    if (!parDomaine.has(dom)) parDomaine.set(dom, new Map());
    const phase = phaseDuStatut(i.mode, i.statutCycle);
    // Les phases agiles (Cadrage/Delivery) se projettent sur les phases communes.
    const commune = phase === 'Cadrage' ? 'Qualification' : phase === 'Delivery' ? 'Réalisation' : phase;
    parDomaine.get(dom)!.set(commune, (parDomaine.get(dom)!.get(commune) ?? 0) + 1);
  }
  return [...parDomaine.entries()]
    .map(([domaine, cellules]) => ({
      domaine,
      total: [...cellules.values()].reduce((s, v) => s + v, 0),
      cellules: PHASES_WF.map((phase) => ({ phase, count: cellules.get(phase) ?? 0 })),
    }))
    .sort((a, b) => b.total - a.total);
}

export const SEUIL_SOUFFRANCE_JOURS = 21;

/** Initiatives en souffrance : immobiles dans leur statut au-delà du seuil. */
export function initiativesEnSouffrance<
  T extends { statutCycle: string; updatedAt: Date | string },
>(initiatives: T[], today: Date = new Date()): (T & { joursImmobile: number })[] {
  return initiatives
    .filter((i) => !STATUTS_TERMINES.includes(i.statutCycle))
    .map((i) => ({
      ...i,
      joursImmobile: Math.floor((today.getTime() - new Date(i.updatedAt).getTime()) / 86_400_000),
    }))
    .filter((i) => i.joursImmobile >= SEUIL_SOUFFRANCE_JOURS)
    .sort((a, b) => b.joursImmobile - a.joursImmobile);
}

// ---------------------------------------------------------------------------
// Analyses DSI — pivots du portefeuille
// ---------------------------------------------------------------------------

export type PivotDomaine = {
  domaine: string;
  total: number;
  actives: number;
  deployees: number;
  agile: number;
  waterfall: number;
  valeurMoyenne: number;
  budget: number;
};

export function pivotParDomaine(
  initiatives: {
    domaine?: string | null;
    mode: string;
    statutCycle: string;
    valeurMetier: number;
    budget?: number | null;
  }[],
): PivotDomaine[] {
  const map = new Map<string, typeof initiatives>();
  for (const i of initiatives) {
    const dom = i.domaine ?? 'Sans domaine';
    if (!map.has(dom)) map.set(dom, []);
    map.get(dom)!.push(i);
  }
  return [...map.entries()]
    .map(([domaine, rows]) => ({
      domaine,
      total: rows.length,
      actives: rows.filter((r) => !STATUTS_TERMINES.includes(r.statutCycle)).length,
      deployees: rows.filter((r) => r.statutCycle === 'DEPLOYE').length,
      agile: rows.filter((r) => r.mode === 'AGILE').length,
      waterfall: rows.filter((r) => r.mode === 'WATERFALL').length,
      valeurMoyenne:
        Math.round((rows.reduce((s2, r) => s2 + r.valeurMetier, 0) / rows.length) * 10) / 10,
      budget: rows.reduce((s2, r) => s2 + (r.budget ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);
}

export type FluxMois = { mois: string; soumissions: number; deploiements: number };

/** Flux du pipeline : initiatives soumises vs déployées, par mois. */
export function fluxMensuel(
  initiatives: { createdAt: Date | string }[],
  transitions: TransitionHisto[],
  nbMois: number = 6,
  today: Date = new Date(),
): FluxMois[] {
  const mois: string[] = [];
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  for (let k = nbMois - 1; k >= 0; k--) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - k, 1));
    mois.push(m.toISOString().slice(0, 7));
  }
  const cle = (x: Date | string) => new Date(x).toISOString().slice(0, 7);
  return mois.map((m) => ({
    mois: m,
    soumissions: initiatives.filter((i) => cle(i.createdAt) === m).length,
    deploiements: transitions.filter((tr) => tr.vers === 'DEPLOYE' && cle(tr.createdAt) === m).length,
  }));
}
