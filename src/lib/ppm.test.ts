import { describe, expect, it } from 'vitest';
import {
  CYCLE_AGILE,
  fluxMensuel,
  pivotParDomaine,
  initiativesEnSouffrance,
  matriceDomainePhase,
  CYCLE_WATERFALL,
  champsRequisPour,
  computeDelivery,
  leadTimeParStatut,
  nomsANotifier,
  rolesANotifier,
  statutInitial,
  transitionAutorisee,
  transitionsPossibles,
} from './ppm';

const TODAY = new Date('2026-07-07T12:00:00Z');

describe('cycles de vie', () => {
  it('couvre les statuts demandés en waterfall et en agile', () => {
    const wf = CYCLE_WATERFALL.map((e) => e.statut);
    for (const s of ['NON_QUALIFIE', 'QUALIFIE', 'GO_NOGO', 'A_SPECIFIER_DSI', 'A_SPECIFIER_METIER', 'A_VALIDER', 'A_REALISER', 'REALISATION_EN_COURS', 'RECETTE_EN_COURS', 'RECETTE_VALIDEE', 'RECETTE_NON_VALIDEE', 'A_DEPLOYER', 'DEPLOYE']) {
      expect(wf).toContain(s);
    }
    expect(CYCLE_AGILE.map((e) => e.statut)).toContain('RECETTE_METIER');
    expect(statutInitial('WATERFALL')).toBe('NON_QUALIFIE');
    expect(statutInitial('AGILE')).toBe('BACKLOG');
  });
});

describe('transitions contrôlées', () => {
  it('suit le flux nominal waterfall et interdit les sauts', () => {
    expect(transitionAutorisee('WATERFALL', 'NON_QUALIFIE', 'QUALIFIE')).toBe(true);
    expect(transitionAutorisee('WATERFALL', 'NON_QUALIFIE', 'A_REALISER')).toBe(false);
    expect(transitionsPossibles('WATERFALL', 'GO_NOGO')).toEqual(['A_SPECIFIER_DSI', 'NOGO']);
  });
  it('la recette non validée renvoie en réalisation', () => {
    expect(transitionsPossibles('WATERFALL', 'RECETTE_NON_VALIDEE')).toEqual(['REALISATION_EN_COURS']);
    expect(transitionsPossibles('AGILE', 'RECETTE_METIER')).toContain('EN_SPRINT');
  });
  it('exige les champs par étape : NoGo motivé, réserves de recette, lot au déploiement', () => {
    expect(champsRequisPour('NOGO')[0]!.champ).toBe('motifGoNoGo');
    expect(champsRequisPour('RECETTE_NON_VALIDEE')[0]!.champ).toBe('reservesRecette');
    expect(champsRequisPour('A_DEPLOYER')[0]!.champ).toBe('lot');
    expect(champsRequisPour('QUALIFIE')).toHaveLength(0);
  });
});

describe('matrice de notifications', () => {
  it('cible les bons rôles aux étapes clés', () => {
    expect(rolesANotifier('WATERFALL', 'A_SPECIFIER_METIER')).toEqual(['PRODUCT_OWNER', 'PROXY_PO']);
    expect(rolesANotifier('WATERFALL', 'RECETTE_EN_COURS')).toContain('KEY_USERS');
    expect(rolesANotifier('WATERFALL', 'A_DEPLOYER')).toEqual(['EQUIPE_MEP']);
    expect(rolesANotifier('AGILE', 'RECETTE_METIER')).toContain('KEY_USERS');
  });
  it('résout les noms depuis les rôles de l’initiative, key users multiples inclus', () => {
    const { noms, inclureDsi } = nomsANotifier('WATERFALL', 'RECETTE_EN_COURS', {
      productOwner: 'S. Benjelloun',
      proxyPo: 'H. Cherkaoui',
      keyUsers: 'K. Alaoui; R. Tazi',
    });
    expect(noms).toEqual(expect.arrayContaining(['K. Alaoui', 'R. Tazi', 'S. Benjelloun', 'H. Cherkaoui']));
    expect(inclureDsi).toBe(false);
    expect(nomsANotifier('WATERFALL', 'RECETTE_VALIDEE', { chefProjet: 'M. El Fassi' }).inclureDsi).toBe(true);
  });
});

describe('indicateurs delivery', () => {
  const ini = (id: string, statut: string, created: string) => ({
    id, mode: 'WATERFALL', statutCycle: statut, createdAt: created,
  });
  const tr = (id: string, de: string, vers: string, date: string) => ({
    initiativeId: id, de, vers, createdAt: date,
  });

  it('mesure le lead time par statut à partir de l’historique', () => {
    const leads = leadTimeParStatut(
      [tr('i1', 'NON_QUALIFIE', 'QUALIFIE', '2026-06-11'), tr('i1', 'QUALIFIE', 'GO_NOGO', '2026-06-21')],
      [ini('i1', 'GO_NOGO', '2026-06-01')],
      TODAY,
    );
    expect(leads.get('NON_QUALIFIE')).toBe(10);
    expect(leads.get('QUALIFIE')).toBe(10);
    expect(leads.get('GO_NOGO')).toBeGreaterThan(15); // en cours depuis le 21/06
  });

  it('calcule TTD médian, throughput, taux de recette OK 1er coup, WIP et âge backlog', () => {
    const transitions = [
      tr('i1', 'A_DEPLOYER', 'DEPLOYE', '2026-06-20'),
      tr('i1', 'RECETTE_EN_COURS', 'RECETTE_VALIDEE', '2026-06-10'),
      tr('i2', 'RECETTE_EN_COURS', 'RECETTE_NON_VALIDEE', '2026-05-01'),
      tr('i2', 'RECETTE_EN_COURS', 'RECETTE_VALIDEE', '2026-06-01'),
      tr('i2', 'A_DEPLOYER', 'DEPLOYE', '2026-07-01'),
    ];
    const initiatives = [
      ini('i1', 'DEPLOYE', '2026-03-22'),
      ini('i2', 'DEPLOYE', '2026-01-02'),
      ini('i3', 'NON_QUALIFIE', '2026-06-27'),
      ini('i4', 'REALISATION_EN_COURS', '2026-04-01'),
    ];
    const d = computeDelivery(transitions, initiatives, TODAY);
    expect(d.timeToDeliveryMedianJours).toBe(90); // i1 : 22/03 → 20/06
    expect(d.throughputParMois).toBeCloseTo(0.3, 1); // 2 déployées / 6 mois
    expect(d.tauxRecetteOkPremierCoup).toBe(50); // i1 OK, i2 retoquée
    expect(d.wipParStatut.get('NON_QUALIFIE')).toBe(1);
    expect(d.wipParStatut.has('DEPLOYE')).toBe(false);
    expect(d.ageMoyenBacklogJours).toBe(11); // 27/06 00h → 07/07 12h = 10,5 j arrondi
  });
});

describe('tableau de bord DSI', () => {
  it('croise domaines × phases, agile projeté sur les phases communes', () => {
    const m = matriceDomainePhase([
      { domaine: 'Cœur métier', mode: 'WATERFALL', statutCycle: 'REALISATION_EN_COURS' },
      { domaine: 'Cœur métier', mode: 'WATERFALL', statutCycle: 'RECETTE_EN_COURS' },
      { domaine: 'Cœur métier', mode: 'AGILE', statutCycle: 'EN_SPRINT' },
      { domaine: 'Support', mode: 'WATERFALL', statutCycle: 'NON_QUALIFIE' },
      { domaine: 'Support', mode: 'WATERFALL', statutCycle: 'DEPLOYE' }, // terminée : exclue
    ]);
    expect(m[0]!.domaine).toBe('Cœur métier');
    expect(m[0]!.total).toBe(3);
    expect(m[0]!.cellules.find((c) => c.phase === 'Réalisation')!.count).toBe(2); // WF + agile EN_SPRINT
    expect(m[1]!.cellules.find((c) => c.phase === 'Qualification')!.count).toBe(1);
  });
  it('détecte les initiatives immobiles au-delà du seuil', () => {
    const rows = initiativesEnSouffrance(
      [
        { statutCycle: 'A_SPECIFIER_METIER', updatedAt: '2026-06-01' },
        { statutCycle: 'EN_SPRINT', updatedAt: '2026-07-01' },
        { statutCycle: 'DEPLOYE', updatedAt: '2026-01-01' },
      ],
      new Date('2026-07-07T12:00:00Z'),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.joursImmobile).toBeGreaterThanOrEqual(36);
  });
});

describe('analyses DSI', () => {
  it('pivote le portefeuille par domaine', () => {
    const p = pivotParDomaine([
      { domaine: 'Cœur métier', mode: 'WATERFALL', statutCycle: 'REALISATION_EN_COURS', valeurMetier: 5, budget: 100 },
      { domaine: 'Cœur métier', mode: 'AGILE', statutCycle: 'DEPLOYE', valeurMetier: 3, budget: 50 },
      { domaine: 'Support', mode: 'WATERFALL', statutCycle: 'NON_QUALIFIE', valeurMetier: 2, budget: null },
    ]);
    expect(p[0]).toMatchObject({ domaine: 'Cœur métier', total: 2, actives: 1, deployees: 1, agile: 1, waterfall: 1, valeurMoyenne: 4, budget: 150 });
  });
  it('trace le flux soumissions vs déploiements par mois', () => {
    const flux = fluxMensuel(
      [{ createdAt: '2026-06-10' }, { createdAt: '2026-07-01' }],
      [{ initiativeId: 'x', de: 'A_DEPLOYER', vers: 'DEPLOYE', createdAt: '2026-07-03' }],
      3,
      new Date('2026-07-07T12:00:00Z'),
    );
    expect(flux.map((f) => f.mois)).toEqual(['2026-05', '2026-06', '2026-07']);
    expect(flux[1]).toMatchObject({ soumissions: 1, deploiements: 0 });
    expect(flux[2]).toMatchObject({ soumissions: 1, deploiements: 1 });
  });
});
