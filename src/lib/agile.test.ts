import { describe, it, expect } from 'vitest';
import { computeVelocity, computeCFD, computeBurndown, type ItemAgile, type SprintAgile } from './agile';

const sprints: SprintAgile[] = [
  { id: 's1', nom: 'Sprint 1', statut: 'CLOS', dateDebut: '2026-01-01', dateFin: '2026-01-11' },
  { id: 's2', nom: 'Sprint 2', statut: 'EN_COURS' },
];

const items: ItemAgile[] = [
  { id: 'a', sprintId: 's1', statut: 'TERMINE', points: 5 },
  { id: 'b', sprintId: 's1', statut: 'TERMINE', points: 3 },
  { id: 'c', sprintId: 's1', statut: 'EN_COURS', points: 2 },
  { id: 'd', sprintId: 's2', statut: 'BACKLOG', points: 8 },
];

describe('computeVelocity', () => {
  it('somme les points terminés par sprint', () => {
    const v = computeVelocity(sprints, items);
    expect(v.find((x) => x.sprint === 'Sprint 1')!.points).toBe(8);
    expect(v.find((x) => x.sprint === 'Sprint 2')!.points).toBe(0);
  });
});

describe('computeCFD', () => {
  it('compte les items par colonne', () => {
    const cfd = computeCFD(items);
    expect(cfd.find((c) => c.colonne === 'TERMINE')!.count).toBe(2);
    expect(cfd.find((c) => c.colonne === 'BACKLOG')!.count).toBe(1);
    expect(cfd.reduce((s, c) => s + c.count, 0)).toBe(4);
  });
});

describe('computeBurndown', () => {
  it('renvoie une ligne idéale du total vers 0', () => {
    const b = computeBurndown(sprints[0]!, items, new Date('2026-01-06'));
    expect(b.length).toBeGreaterThan(0);
    expect(b[0]!.ideal).toBe(10); // total points du sprint s1 = 5+3+2
    expect(b[b.length - 1]!.ideal).toBe(0);
  });

  it('renvoie vide sans dates ou sans points', () => {
    expect(computeBurndown(sprints[1]!, items)).toEqual([]);
  });
});
