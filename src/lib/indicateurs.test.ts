import { describe, it, expect } from 'vitest';
import { consoliderIndicateurs, tauxRealisation, type IndicateurLigne } from './indicateurs';

describe('tauxRealisation', () => {
  it('sens HAUSSE : réalisé / cible', () => {
    expect(tauxRealisation(200, 100, 'HAUSSE')).toBe(50);
    expect(tauxRealisation(200, 300, 'HAUSSE')).toBe(100); // plafonné à 100
  });

  it('sens BAISSE : atteint si réalisé ≤ cible', () => {
    expect(tauxRealisation(2000, 4000, 'BAISSE')).toBe(50); // au-dessus de la cible → 50 %
    expect(tauxRealisation(2000, 1000, 'BAISSE')).toBe(100); // sous la cible → 100 %
  });

  it('renvoie null si une valeur manque', () => {
    expect(tauxRealisation(null, 100, 'HAUSSE')).toBeNull();
    expect(tauxRealisation(100, null, 'HAUSSE')).toBeNull();
  });
});

describe('consoliderIndicateurs', () => {
  it('somme les cibles/réalisés par libellé + unité (remontée ascendante)', () => {
    const lignes: IndicateurLigne[] = [
      { actionId: 'a', libelle: 'Radars déployés', unite: 'u', cible: 100, realise: 60, sens: 'HAUSSE' },
      { actionId: 'b', libelle: 'radars déployés', unite: 'U', cible: 100, realise: 70, sens: 'HAUSSE' },
      { actionId: 'c', libelle: 'Km audités', unite: 'km', cible: 500, realise: 250, sens: 'HAUSSE' },
    ];
    const r = consoliderIndicateurs(lignes);
    expect(r).toHaveLength(2);
    const radars = r.find((x) => x.libelle.toLowerCase() === 'radars déployés')!;
    expect(radars.cible).toBe(200);
    expect(radars.realise).toBe(130);
    expect(radars.tauxRealisation).toBe(65);
    expect(radars.nbSources).toBe(2);
  });

  it('exclut les indicateurs non agrégeables', () => {
    const lignes: IndicateurLigne[] = [
      { actionId: 'a', libelle: 'Taux %', cible: 100, realise: 50, agregeable: false },
    ];
    expect(consoliderIndicateurs(lignes)).toHaveLength(0);
  });
});
