import { describe, it, expect } from 'vitest';
import {
  construireArbre,
  aplatirArbre,
  niveauEnfantAttendu,
  niveauCoherent,
  idsDescendants,
  calculerCodesArbre,
} from './tree';

type N = { id: string; parentId?: string | null; ordre?: number | null; niveau?: number };

describe('construireArbre', () => {
  it('reconstruit une forêt imbriquée', () => {
    const plat: N[] = [
      { id: 'ps1', parentId: null, ordre: 0 },
      { id: 'cs1', parentId: 'ps1', ordre: 0 },
      { id: 'prj1', parentId: 'cs1', ordre: 0 },
      { id: 'ps2', parentId: null, ordre: 1 },
    ];
    const arbre = construireArbre(plat);
    expect(arbre).toHaveLength(2);
    expect(arbre[0]!.id).toBe('ps1');
    expect(arbre[0]!.enfants[0]!.id).toBe('cs1');
    expect(arbre[0]!.enfants[0]!.enfants[0]!.id).toBe('prj1');
    expect(arbre[0]!.enfants[0]!.enfants[0]!.profondeur).toBe(2);
  });

  it('trie la fratrie par ordre puis par id', () => {
    const plat: N[] = [
      { id: 'b', parentId: null, ordre: 2 },
      { id: 'a', parentId: null, ordre: 2 },
      { id: 'c', parentId: null, ordre: 1 },
    ];
    expect(construireArbre(plat).map((n) => n.id)).toEqual(['c', 'a', 'b']);
  });

  it('traite un parent absent comme une racine (robustesse)', () => {
    const plat: N[] = [{ id: 'orphelin', parentId: 'inexistant' }];
    const arbre = construireArbre(plat);
    expect(arbre).toHaveLength(1);
    expect(arbre[0]!.id).toBe('orphelin');
  });

  it('ignore un auto-parent (cycle trivial)', () => {
    const plat: N[] = [{ id: 'x', parentId: 'x' }];
    const arbre = construireArbre(plat);
    expect(arbre).toHaveLength(1);
    expect(arbre[0]!.enfants).toHaveLength(0);
  });
});

describe('aplatirArbre', () => {
  it('parcourt en profondeur dans l’ordre d’affichage', () => {
    const plat: N[] = [
      { id: 'ps1', parentId: null, ordre: 0 },
      { id: 'cs1', parentId: 'ps1', ordre: 0 },
      { id: 'cs2', parentId: 'ps1', ordre: 1 },
      { id: 'ps2', parentId: null, ordre: 1 },
    ];
    const ids = aplatirArbre(construireArbre(plat)).map((n) => n.id);
    expect(ids).toEqual(['ps1', 'cs1', 'cs2', 'ps2']);
  });
});

describe('règle de niveau', () => {
  it('niveau(enfant) = niveau(parent) + 1', () => {
    expect(niveauEnfantAttendu(1)).toBe(2);
    expect(niveauCoherent(3, 4)).toBe(true);
    expect(niveauCoherent(3, 5)).toBe(false);
    expect(niveauCoherent(3, 3)).toBe(false);
  });
});

describe('calculerCodesArbre', () => {
  it('génère des codes cohérents avec l’arbre', () => {
    const plat = [
      { id: 'ps1', parentId: null, ordre: 0, niveau: 1 },
      { id: 'cs1', parentId: 'ps1', ordre: 0, niveau: 2 },
      { id: 'cs2', parentId: 'ps1', ordre: 1, niveau: 2 },
      { id: 'prj1', parentId: 'cs2', ordre: 0, niveau: 3 },
    ];
    const codes = calculerCodesArbre(plat);
    expect(codes.get('ps1')).toBe('PS1');
    expect(codes.get('cs1')).toBe('PS1.CS1');
    expect(codes.get('cs2')).toBe('PS1.CS2');
    expect(codes.get('prj1')).toBe('PS1.CS2.PRJ1');
  });
});

describe('idsDescendants', () => {
  it('collecte le nœud et toute sa descendance', () => {
    const plat: N[] = [
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
      { id: 'c', parentId: 'b' },
      { id: 'd', parentId: null },
    ];
    const a = construireArbre(plat).find((n) => n.id === 'a')!;
    expect(idsDescendants(a).sort()).toEqual(['a', 'b', 'c']);
  });
});
