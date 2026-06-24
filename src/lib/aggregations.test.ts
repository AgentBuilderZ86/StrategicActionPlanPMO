import { describe, it, expect } from 'vitest';
import {
  computeKpis,
  computeHeatmap,
  aggregateByDimension,
  repartitionStatuts,
  pointsAttention,
  computeTrend,
  type AggAction,
} from './aggregations';
import { enRetard } from './utils';

const hier = new Date(Date.now() - 86_400_000).toISOString();
const demain = new Date(Date.now() + 86_400_000).toISOString();

const actions: AggAction[] = [
  { id: '1', titre: 'A', axeId: 'ax1', paysId: 'p1', entiteId: 'e1', axe: 'Axe 1', pays: 'Maroc', responsable: 'X', statut: 'TERMINE', priorite: 'HAUTE', avancement: 100, budget: 100, budgetConso: 90, dateFin: hier },
  { id: '2', titre: 'B', axeId: 'ax1', paysId: 'p1', entiteId: 'e1', axe: 'Axe 1', pays: 'Maroc', responsable: 'Y', statut: 'EN_COURS', priorite: 'MOYENNE', avancement: 50, budget: 200, budgetConso: 50, dateFin: hier },
  { id: '3', titre: 'C', axeId: 'ax2', paysId: 'p2', entiteId: 'e2', axe: 'Axe 2', pays: 'Sénégal', responsable: 'Z', statut: 'BLOQUE', priorite: 'BASSE', avancement: 20, budget: 50, budgetConso: 10, dateFin: demain },
];

describe('enRetard', () => {
  it('est vrai si échéance passée et non terminé', () => {
    expect(enRetard(hier, 'EN_COURS')).toBe(true);
  });
  it('est faux si terminé', () => {
    expect(enRetard(hier, 'TERMINE')).toBe(false);
  });
  it('est faux sans date de fin', () => {
    expect(enRetard(null, 'EN_COURS')).toBe(false);
  });
});

describe('computeKpis', () => {
  const k = computeKpis(actions);
  it('compte le total et les statuts', () => {
    expect(k.total).toBe(3);
    expect(k.terminees).toBe(1);
    expect(k.bloquees).toBe(1);
    expect(k.enCours).toBe(1);
  });
  it("calcule l'avancement moyen", () => {
    expect(k.avancementMoyen).toBe(Math.round((100 + 50 + 20) / 3));
  });
  it('compte les actions en retard (B uniquement)', () => {
    expect(k.enRetard).toBe(1);
  });
  it('additionne les budgets', () => {
    expect(k.budgetTotal).toBe(350);
    expect(k.budgetConso).toBe(150);
  });
});

describe('computeHeatmap', () => {
  it('produit une cellule par pays × axe', () => {
    const rows = computeHeatmap(
      actions,
      [{ id: 'p1', nom: 'Maroc' }, { id: 'p2', nom: 'Sénégal' }],
      [{ id: 'ax1', nom: 'Axe 1' }, { id: 'ax2', nom: 'Axe 2' }],
    );
    expect(rows).toHaveLength(2);
    const maroc = rows.find((r) => r.paysId === 'p1')!;
    expect(maroc.cells.find((c) => c.axeId === 'ax1')!.count).toBe(2);
    expect(maroc.cells.find((c) => c.axeId === 'ax1')!.pct).toBe(75);
    expect(maroc.cells.find((c) => c.axeId === 'ax2')!.count).toBe(0);
  });
});

describe('aggregateByDimension', () => {
  it('regroupe par axe', () => {
    const res = aggregateByDimension(actions, (a) => a.axeId, (a) => a.axe ?? '');
    expect(res).toHaveLength(2);
    const ax1 = res.find((r) => r.key === 'ax1')!;
    expect(ax1.count).toBe(2);
    expect(ax1.budget).toBe(300);
  });
});

describe('repartitionStatuts', () => {
  it('ne renvoie que les statuts présents', () => {
    const r = repartitionStatuts(actions);
    expect(r.map((x) => x.statut).sort()).toEqual(['BLOQUE', 'EN_COURS', 'TERMINE']);
  });
});

describe('pointsAttention', () => {
  it('renvoie les bloquées + en retard triées par priorité', () => {
    const pa = pointsAttention(actions);
    // B (en retard, MOYENNE) et C (bloquée, BASSE) ; A terminée exclue
    expect(pa.map((a) => a.id)).toEqual(['2', '3']);
  });
});

describe('computeTrend', () => {
  it("moyenne l'avancement par mois cumulé", () => {
    const trend = computeTrend([
      { actionId: '1', date: '2026-01-15', valeur: 20 },
      { actionId: '1', date: '2026-02-15', valeur: 60 },
      { actionId: '2', date: '2026-02-20', valeur: 40 },
    ]);
    expect(trend).toHaveLength(2);
    expect(trend[0]).toEqual({ periode: '2026-01', avancement: 10 }); // (20 + 0)/2
    expect(trend[1]).toEqual({ periode: '2026-02', avancement: 50 }); // (60 + 40)/2
  });
});
