import { describe, expect, it } from 'vitest';
import { computeMaJournee, echeancesProches, fileCheckin, mesActions } from './ma-journee';
import type { ActionJour } from './ma-journee';

const TODAY = new Date('2026-07-07T12:00:00Z');

const base = (over: Partial<ActionJour> = {}): ActionJour =>
  ({
    id: 'a1',
    titre: 'Action test',
    description: null,
    planId: 'p1',
    axeId: 'ax1',
    paysId: 'pays1',
    entiteId: 'e1',
    parentId: null,
    ordre: 0,
    axe: 'Digital',
    pays: 'Maroc',
    entite: 'Filiale A',
    responsable: 'Salma Bennani',
    statut: 'EN_COURS',
    avancement: 50,
    priorite: 'MOYENNE',
    dateDebut: '2026-01-01T00:00:00.000Z',
    dateFin: '2026-12-31T00:00:00.000Z',
    budget: null,
    budgetConso: null,
    commentaire: null,
    enRetard: false,
    niveau: 4,
    code: null,
    indicateur: null,
    cibleIndicateur: null,
    valeurIndicateur: null,
    confiance: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }) as ActionJour;

describe('mesActions', () => {
  it('matche le responsable par nom, insensible à la casse et aux accents', () => {
    const actions = [base(), base({ id: 'a2', responsable: 'Karim Ndiaye' })];
    expect(mesActions(actions, { name: 'salma bennani' }).map((a) => a.id)).toEqual(['a1']);
    expect(mesActions(actions, { name: 'Salma BENNANI' })).toHaveLength(1);
  });
  it('replie sur le périmètre pays quand aucun nom ne matche', () => {
    const actions = [base(), base({ id: 'a2', paysId: 'pays2' })];
    const mine = mesActions(actions, { name: 'Inconnu', perimetrePays: ['pays2'] });
    expect(mine.map((a) => a.id)).toEqual(['a2']);
  });
  it('renvoie vide sans nom ni périmètre', () => {
    expect(mesActions([base()], {})).toHaveLength(0);
  });
});

describe('echeancesProches', () => {
  it('remonte les échéances sous N jours triées par date, retards inclus', () => {
    const actions = [
      base({ id: 'loin', dateFin: '2026-12-31T00:00:00.000Z' }),
      base({ id: 'proche', dateFin: '2026-07-15T00:00:00.000Z' }),
      base({ id: 'retard', dateFin: '2026-06-30T00:00:00.000Z', enRetard: true }),
      base({ id: 'fini', dateFin: '2026-07-10T00:00:00.000Z', statut: 'TERMINE' }),
    ];
    expect(echeancesProches(actions, 14, TODAY).map((a) => a.id)).toEqual(['retard', 'proche']);
  });
});

describe('fileCheckin', () => {
  it('trie mes actions actives par risque décroissant', () => {
    const actions = [
      base({ id: 'saine', avancement: 55 }),
      base({ id: 'derive', avancement: 10 }),
      base({ id: 'finie', statut: 'TERMINE' }),
    ];
    const file = fileCheckin(actions, { name: 'Salma Bennani' }, TODAY);
    expect(file.map((a) => a.id)).toEqual(['derive', 'saine']);
  });
});

describe('computeMaJournee', () => {
  it('réserve les risques du plan au pilotage (PMO/ADMIN)', () => {
    const actions = [base({ avancement: 10 })];
    expect(computeMaJournee(actions, { name: 'X', role: 'CONTRIBUTEUR' }, TODAY).risquesPlan).toHaveLength(0);
    expect(computeMaJournee(actions, { name: 'X', role: 'PMO' }, TODAY).risquesPlan.length).toBeGreaterThan(0);
  });
  it('compte mes retards', () => {
    const actions = [base({ dateFin: '2026-06-01T00:00:00.000Z', enRetard: true })];
    const vue = computeMaJournee(actions, { name: 'Salma Bennani', role: 'CONTRIBUTEUR' }, TODAY);
    expect(vue.mesRetards).toBe(1);
    expect(vue.mesActions).toHaveLength(1);
  });
});
