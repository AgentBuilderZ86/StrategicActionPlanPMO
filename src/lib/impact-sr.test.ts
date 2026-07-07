import { describe, expect, it } from 'vitest';
import {
  BAROMETRE_2024,
  LEVIERS_SR,
  enjeuAction,
  enjeuCumule,
  leviersPourTexte,
} from './impact-sr';

describe('leviersPourTexte', () => {
  it('reconnaît un levier par mot-clé, insensible aux accents et à la casse', () => {
    expect(leviersPourTexte('Campagne CASQUE pour les motos').map((l) => l.code)).toContain('CASQUE_2RM');
    expect(leviersPourTexte('Déploiement de radars automatisés').map((l) => l.code)).toContain('CONTROLE_AUTO');
    expect(leviersPourTexte('Sécurisation des passages piétons').map((l) => l.code)).toContain('PIETONS');
  });
  it('ne reconnaît rien dans un texte sans rapport', () => {
    expect(leviersPourTexte('Migration du CRM vers le cloud')).toHaveLength(0);
  });
});

describe('enjeuAction', () => {
  it('retient le levier au potentiel le plus fort en cas de multi-correspondance', () => {
    const enjeu = enjeuAction({ titre: 'Radars et limitation de vitesse sur bidirectionnelles' });
    expect(enjeu!.levier.code).toBe('CONTROLE_AUTO'); // 420 > 250
  });
  it("s'appuie aussi sur la description et l'axe", () => {
    expect(enjeuAction({ titre: 'Programme X', description: 'formation des auto-écoles' })!.levier.code).toBe('EDUCATION');
    expect(enjeuAction({ titre: 'Programme Y', axe: 'Secours et urgences' })!.levier.code).toBe('SECOURS');
    expect(enjeuAction({ titre: 'Programme Z' })).toBeNull();
  });
});

describe('enjeuCumule', () => {
  it("compte chaque levier une seule fois et ignore les actions terminées", () => {
    const enjeu = enjeuCumule([
      { titre: 'Campagne casque motos', statut: 'EN_COURS' },
      { titre: 'Distribution de casques 2RM', statut: 'EN_COURS' }, // même levier
      { titre: 'Déploiement radars', statut: 'EN_COURS' },
      { titre: 'Radars tronçon sud', statut: 'TERMINE' }, // terminée : ignorée
      { titre: 'Refonte RH', statut: 'EN_COURS' }, // aucun levier
    ]);
    expect(enjeu.leviers.map((l) => l.code).sort()).toEqual(['CASQUE_2RM', 'CONTROLE_AUTO']);
    expect(enjeu.actionsCouvertes).toBe(3);
    expect(enjeu.viesMin).toBe(200 + 150);
    expect(enjeu.viesMax).toBe(300 + 420);
  });
});

describe('référentiel', () => {
  it('les fourchettes sont cohérentes et sourcées', () => {
    for (const l of LEVIERS_SR) {
      expect(l.viesMin).toBeGreaterThan(0);
      expect(l.viesMax).toBeGreaterThanOrEqual(l.viesMin);
      expect(l.viesMax).toBeLessThanOrEqual(BAROMETRE_2024.tues);
      expect(l.fondement.length).toBeGreaterThan(20);
      expect(l.reference).toContain('Baromètre');
    }
  });
});
