import { describe, it, expect } from 'vitest';
import { calculerGantt, type GanttItem } from './planning';

const base = { statut: 'EN_COURS', avancement: 50, niveau: 2 };

describe('calculerGantt', () => {
  it('renvoie null sans aucune date', () => {
    const items: GanttItem[] = [{ id: 'a', titre: 'A', dateDebut: null, dateFin: null, ...base }];
    expect(calculerGantt(items)).toBeNull();
  });

  it('positionne les barres en pourcentage de la plage', () => {
    const items: GanttItem[] = [
      { id: 'a', titre: 'A', dateDebut: '2026-01-01', dateFin: '2026-01-31', ...base },
      { id: 'b', titre: 'B', dateDebut: '2026-02-01', dateFin: '2026-03-01', ...base },
    ];
    const g = calculerGantt(items, new Date('2026-01-15'))!;
    expect(g).not.toBeNull();
    expect(g.bars[0]!.offsetPct).toBe(0);
    expect(g.bars[1]!.offsetPct).toBeGreaterThan(0);
    // La dernière barre se termine à 100 %.
    expect(g.bars[1]!.offsetPct + g.bars[1]!.widthPct).toBeCloseTo(100, 5);
  });

  it('calcule la position du jour s’il est dans la plage', () => {
    const items: GanttItem[] = [{ id: 'a', titre: 'A', dateDebut: '2026-01-01', dateFin: '2026-01-11', ...base }];
    const g = calculerGantt(items, new Date('2026-01-06'))!;
    expect(g.todayPct).toBeGreaterThan(0);
    expect(g.todayPct).toBeLessThan(100);
  });

  it('marque les actions sans dates', () => {
    const items: GanttItem[] = [
      { id: 'a', titre: 'A', dateDebut: '2026-01-01', dateFin: '2026-01-31', ...base },
      { id: 'b', titre: 'B', dateDebut: null, dateFin: null, ...base },
    ];
    const g = calculerGantt(items)!;
    expect(g.bars.find((x) => x.id === 'b')!.sansDates).toBe(true);
  });
});
