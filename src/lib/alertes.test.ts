import { describe, expect, it } from 'vitest';
import {
  MOTIF_REACTIVATION,
  MOTIF_RESORPTION,
  construireDigest,
  rapprocherAlertes,
  transitionValide,
} from './alertes';
import type { RisqueAction } from './risque';

const risque = (actionId: string, score: number): RisqueAction => ({
  action: { id: actionId, axeId: null, paysId: null, entiteId: null, statut: 'EN_COURS', priorite: 'MOYENNE', avancement: 20 },
  score,
  niveau: score >= 60 ? 'CRITIQUE' : score >= 35 ? 'ELEVE' : 'MODERE',
  facteurs: [{ code: 'VELOCITE', label: 'Dérive de vélocité', detail: 'test', points: score }],
});

describe('rapprocherAlertes', () => {
  it('crée une alerte pour toute dérive ÉLEVÉE sans alerte ouverte', () => {
    const sync = rapprocherAlertes([], [risque('a1', 70), risque('a2', 20)]);
    expect(sync.creer.map((c) => c.actionId)).toEqual(['a1']);
    expect(sync.mettreAJour).toHaveLength(0);
    expect(sync.resoudre).toHaveLength(0);
  });
  it("met à jour le score d'une alerte ouverte sans en recréer", () => {
    const sync = rapprocherAlertes(
      [{ id: 'al1', actionId: 'a1', statut: 'PRISE_EN_CHARGE', score: 50 }],
      [risque('a1', 65)],
    );
    expect(sync.creer).toHaveLength(0);
    expect(sync.mettreAJour).toEqual([expect.objectContaining({ id: 'al1', score: 65 })]);
  });
  it('résout automatiquement une dérive résorbée', () => {
    const sync = rapprocherAlertes(
      [{ id: 'al1', actionId: 'a1', statut: 'NOUVELLE', score: 50 }],
      [risque('a1', 10)],
    );
    expect(sync.resoudre).toEqual([{ id: 'al1', motif: MOTIF_RESORPTION }]);
  });
  it('résout aussi quand le risque a totalement disparu', () => {
    const sync = rapprocherAlertes([{ id: 'al1', actionId: 'a1', statut: 'NOUVELLE', score: 50 }], []);
    expect(sync.resoudre).toHaveLength(1);
  });
  it("respecte l'acceptation du risque, sauf aggravation nette", () => {
    const acceptee = [{ id: 'al1', actionId: 'a1', statut: 'ACCEPTEE', score: 50 }];
    expect(rapprocherAlertes(acceptee, [risque('a1', 55)]).creer).toHaveLength(0);
    const sync = rapprocherAlertes(acceptee, [risque('a1', 62)]);
    expect(sync.creer).toEqual([expect.objectContaining({ actionId: 'a1', motif: MOTIF_REACTIVATION })]);
  });
  it('est idempotent quand rien ne change', () => {
    const sync = rapprocherAlertes(
      [{ id: 'al1', actionId: 'a1', statut: 'NOUVELLE', score: 70 }],
      [risque('a1', 70)],
    );
    expect(sync.creer).toHaveLength(0);
    expect(sync.mettreAJour).toHaveLength(0);
    expect(sync.resoudre).toHaveLength(0);
  });
});

describe('transitionValide', () => {
  it('applique le cycle de vie', () => {
    expect(transitionValide('NOUVELLE', 'PRISE_EN_CHARGE')).toBe(true);
    expect(transitionValide('PRISE_EN_CHARGE', 'RESOLUE')).toBe(true);
    expect(transitionValide('RESOLUE', 'NOUVELLE')).toBe(false);
    expect(transitionValide('ACCEPTEE', 'NOUVELLE')).toBe(true);
    expect(transitionValide('NOUVELLE', 'NOUVELLE' as never)).toBe(false);
  });
});

describe('construireDigest', () => {
  it('synthétise les alertes ouvertes, les plus critiques en tête', () => {
    const digest = construireDigest([
      { score: 40, niveau: 'ELEVE', statut: 'NOUVELLE', titre: 'B' },
      { score: 80, niveau: 'CRITIQUE', statut: 'PRISE_EN_CHARGE', titre: 'A' },
      { score: 90, niveau: 'CRITIQUE', statut: 'RESOLUE', titre: 'exclue' },
    ]);
    expect(digest).not.toBeNull();
    expect(digest!.titre).toContain('2 ouvertes');
    expect(digest!.titre).toContain('1 critique');
    expect(digest!.message.startsWith('• [80] A')).toBe(true);
  });
  it("renvoie null s'il n'y a rien à digérer", () => {
    expect(construireDigest([{ score: 10, niveau: 'FAIBLE', statut: 'RESOLUE', titre: 'x' }])).toBeNull();
  });
});
