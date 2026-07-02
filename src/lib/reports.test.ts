import { describe, it, expect } from 'vitest';
import { construireRapport, feuilleBudget, feuilleSynthese } from './reports';
import type { Kpis, DimAgg } from './aggregations';

const kpis: Kpis = {
  total: 10, avancementMoyen: 55, terminees: 3, enCours: 5, bloquees: 1, enRetard: 2,
  budgetTotal: 1000, budgetConso: 400,
};

const dim = (label: string, budget: number, conso: number): DimAgg => ({
  key: label, label, count: 2, terminees: 1, bloquees: 0, enRetard: 0, avancementMoyen: 50, budget, budgetConso: conso,
});

describe('feuilleSynthese', () => {
  it('rend les indicateurs clés avec taux de consommation', () => {
    const f = feuilleSynthese(kpis);
    expect(f.nom).toBe('Synthèse');
    expect(f.lignes.find((l) => l[0] === 'Taux de consommation')![1]).toBe('40 %');
  });
});

describe('feuilleBudget', () => {
  it('calcule reste et taux par axe', () => {
    const f = feuilleBudget([dim('Axe 1', 200, 50)]);
    expect(f.lignes[0]).toEqual(['Axe 1', 200, 50, 150, '25 %']);
  });
});

describe('construireRapport', () => {
  it('assemble 4 feuilles', () => {
    const r = construireRapport({ kpis, parAxe: [dim('A', 100, 20)], parPays: [dim('R', 100, 20)] });
    expect(r.map((f) => f.nom)).toEqual(['Synthèse', 'Par axe', 'Par région', 'Exécution budgétaire']);
  });
});
