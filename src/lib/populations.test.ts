import { describe, expect, it } from 'vitest';
import {
  chargeActive,
  estSaturee,
  pulseValide,
  receptivite,
  recommander,
  type ActionLiee,
  type ProfilPopulation,
} from './populations';

const profil = (over: Partial<ProfilPopulation> = {}): ProfilPopulation => ({
  nom: 'Agents guichet Nord',
  effectif: 240,
  trancheAge: 'PLUS_50',
  ancienneteMoyenne: 16,
  maturiteDigitale: 2,
  expositionChangement: 'FORTE',
  ...over,
});

const action = (over: Partial<ActionLiee> = {}): ActionLiee => ({
  titre: 'Action',
  statut: 'EN_COURS',
  niveauImpact: 'TRANSFORME',
  ...over,
});

describe('pulseValide / charge / saturation', () => {
  it('impose le k-anonymat à 8 répondants', () => {
    expect(pulseValide(7)).toBe(false);
    expect(pulseValide(8)).toBe(true);
  });
  it('compte la charge active et détecte la saturation', () => {
    const actions = [action(), action(), action({ statut: 'TERMINE' })];
    expect(chargeActive(actions)).toBe(2);
    expect(estSaturee(actions)).toBe(false);
    expect(estSaturee(Array.from({ length: 5 }, () => action()))).toBe(true);
  });
});

describe('receptivite', () => {
  it('pondère adhésion, préparation, maturité et charge', () => {
    const basse = receptivite(profil(), { adhesion: 30, comprehension: 40, preparation: 30, repondants: 10 }, 6);
    const haute = receptivite(profil({ maturiteDigitale: 5 }), { adhesion: 90, comprehension: 90, preparation: 85, repondants: 10 }, 1);
    expect(basse).toBeLessThan(45);
    expect(haute).toBeGreaterThan(80);
  });
  it('neutralise les scores pulse à 60 sans mesure', () => {
    const sans = receptivite(profil({ maturiteDigitale: 3 }), null, 2);
    expect(sans).toBeGreaterThan(50);
    expect(sans).toBeLessThan(80);
  });
});

describe('recommander (playbooks)', () => {
  it('propose le rephasage en cas de saturation', () => {
    const recos = recommander(profil(), null, Array.from({ length: 6 }, () => action()));
    expect(recos.some((r) => r.code === 'SATURATION')).toBe(true);
    expect(recos[0]!.actionSuggeree.titre).toContain('Rephasage');
  });
  it('recommande les relais terrain pour une population peu digitale transformée', () => {
    const recos = recommander(profil({ maturiteDigitale: 2 }), null, [action()]);
    expect(recos.some((r) => r.code === 'RELAIS_TERRAIN')).toBe(true);
  });
  it('recommande la co-construction quand adhésion basse + forte ancienneté', () => {
    const recos = recommander(profil(), { adhesion: 41, comprehension: 50, preparation: 55, repondants: 30 }, [action()]);
    expect(recos.some((r) => r.code === 'CO_CONSTRUCTION')).toBe(true);
  });
  it('recommande le micro-learning pour une population jeune et digitale', () => {
    const recos = recommander(
      profil({ trancheAge: 'MOINS_35', maturiteDigitale: 5, ancienneteMoyenne: 3 }),
      { adhesion: 60, comprehension: 70, preparation: 65, repondants: 20 },
      [action({ niveauImpact: 'FORME' })],
    );
    expect(recos.some((r) => r.code === 'MICRO_LEARNING')).toBe(true);
  });
  it('plafonne à 3 recommandations, priorisées', () => {
    const recos = recommander(
      profil(),
      { adhesion: 30, comprehension: 40, preparation: 30, repondants: 20 },
      Array.from({ length: 6 }, () => action()),
    );
    expect(recos).toHaveLength(3);
    expect(recos[0]!.code).toBe('SATURATION');
  });
  it('reste silencieux sur une population sereine', () => {
    const recos = recommander(
      profil({ maturiteDigitale: 4, trancheAge: 'MIXTE', ancienneteMoyenne: 5 }),
      { adhesion: 80, comprehension: 85, preparation: 80, repondants: 25 },
      [action({ niveauImpact: 'INFORME' })],
    );
    expect(recos).toHaveLength(0);
  });
});
