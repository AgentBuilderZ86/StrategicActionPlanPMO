import { describe, expect, it } from 'vitest';
import {
  avancementAttendu,
  computeInsights,
  computeRisques,
  facteursAction,
  niveauRisque,
  type RisqueInput,
} from './risque';

const TODAY = new Date('2026-07-07T12:00:00Z');

const base = (over: Partial<RisqueInput> = {}): RisqueInput => ({
  id: 'a1',
  axeId: 'ax1',
  paysId: 'p1',
  entiteId: 'e1',
  axe: 'Digital',
  pays: 'Maroc',
  entite: 'Filiale A',
  responsable: 'S. Bennani',
  statut: 'EN_COURS',
  priorite: 'MOYENNE',
  avancement: 50,
  dateDebut: '2026-01-01',
  dateFin: '2026-12-31',
  updatedAt: '2026-07-01',
  ...over,
});

describe('avancementAttendu', () => {
  it('calcule la part du délai écoulé', () => {
    // ~51 % de l'année écoulée au 7 juillet.
    expect(avancementAttendu(base(), TODAY)).toBeGreaterThanOrEqual(50);
    expect(avancementAttendu(base(), TODAY)).toBeLessThanOrEqual(53);
  });
  it('borne à 100 après échéance et ignore les actions terminées ou non datées', () => {
    expect(avancementAttendu(base({ dateFin: '2026-03-31' }), TODAY)).toBe(100);
    expect(avancementAttendu(base({ statut: 'TERMINE' }), TODAY)).toBeNull();
    expect(avancementAttendu(base({ dateDebut: null }), TODAY)).toBeNull();
  });
});

describe('facteursAction', () => {
  it('détecte la dérive de vélocité AVANT le retard', () => {
    const f = facteursAction(base({ avancement: 20 }), TODAY); // attendu ~51 %
    const v = f.find((x) => x.code === 'VELOCITE');
    expect(v).toBeDefined();
    expect(v!.label).toBe('Dérive de vélocité'); // pas encore en retard
    expect(v!.points).toBeGreaterThanOrEqual(15);
  });
  it("ne signale pas une action dans les temps", () => {
    const f = facteursAction(base({ avancement: 55 }), TODAY);
    expect(f.find((x) => x.code === 'VELOCITE')).toBeUndefined();
  });
  it('détecte le burn budgétaire décorrélé', () => {
    const f = facteursAction(base({ avancement: 55, budget: 100, budgetConso: 90 }), TODAY);
    const b = f.find((x) => x.code === 'BUDGET');
    expect(b).toBeDefined();
    expect(b!.points).toBeGreaterThanOrEqual(5);
    expect(b!.points).toBeLessThanOrEqual(25);
  });
  it('détecte une action dormante', () => {
    const f = facteursAction(base({ avancement: 55, updatedAt: '2026-06-01' }), TODAY);
    const d = f.find((x) => x.code === 'DORMANTE');
    expect(d).toBeDefined();
    expect(d!.points).toBe(20); // 5 semaines, plafonné
  });
  it('intègre le signal humain de confiance déclaré au check-in', () => {
    const f = facteursAction(base({ avancement: 55, confiance: 1 }), TODAY);
    const c = f.find((x) => x.code === 'CONFIANCE');
    expect(c).toBeDefined();
    expect(c!.points).toBe(12);
    expect(facteursAction(base({ avancement: 55, confiance: 4 }), TODAY).some((x) => x.code === 'CONFIANCE')).toBe(false);
  });
  it('signale un blocage déclaré et ignore les actions terminées', () => {
    expect(facteursAction(base({ statut: 'BLOQUE', avancement: 55 }), TODAY).some((x) => x.code === 'BLOQUE')).toBe(true);
    expect(facteursAction(base({ statut: 'TERMINE', avancement: 10 }), TODAY)).toHaveLength(0);
  });
});

describe('computeRisques', () => {
  it('ajoute la surcharge responsable, trie par score et filtre le bruit', () => {
    const actions: RisqueInput[] = [
      base({ id: 'r1', avancement: 10 }), // grosse dérive
      base({ id: 'r2', avancement: 45 }), // dans les temps → exclu
      base({ id: 'r3', avancement: 30 }),
      base({ id: 'r4', avancement: 35 }),
      base({ id: 'r5', avancement: 40, statut: 'BLOQUE' }),
    ];
    const risques = computeRisques(actions, TODAY);
    expect(risques[0]!.action.id).toBe('r1');
    expect(risques.some((r) => r.action.id === 'r2')).toBe(false);
    // 5 actions actives pour le même responsable → facteur SURCHARGE présent.
    expect(risques[0]!.facteurs.some((f) => f.code === 'SURCHARGE')).toBe(true);
    expect(risques.every((r) => r.score >= 15)).toBe(true);
  });
  it('borne le score à 100', () => {
    const [r] = computeRisques(
      [base({ avancement: 0, dateFin: '2026-02-01', budget: 100, budgetConso: 100, statut: 'BLOQUE', updatedAt: '2026-01-01' })],
      TODAY,
    );
    expect(r!.score).toBeLessThanOrEqual(100);
    expect(r!.niveau).toBe('CRITIQUE');
  });
});

describe('niveauRisque', () => {
  it('applique les seuils', () => {
    expect(niveauRisque(70)).toBe('CRITIQUE');
    expect(niveauRisque(40)).toBe('ELEVE');
    expect(niveauRisque(20)).toBe('MODERE');
    expect(niveauRisque(5)).toBe('FAIBLE');
  });
});

describe('computeInsights', () => {
  it('détecte un axe en dérive et une concentration par entité', () => {
    const actions: RisqueInput[] = [
      base({ id: 'i1', avancement: 10, responsable: 'A' }),
      base({ id: 'i2', avancement: 15, responsable: 'B' }),
      base({ id: 'i3', avancement: 20, responsable: 'C' }),
      base({ id: 'i4', avancement: 10, statut: 'BLOQUE', responsable: 'D' }),
      base({ id: 'i5', avancement: 10, statut: 'BLOQUE', responsable: 'E' }),
      base({ id: 'i6', avancement: 10, statut: 'BLOQUE', entite: 'Filiale B', responsable: 'F' }),
    ];
    const insights = computeInsights(actions, TODAY);
    expect(insights.some((i) => i.code === 'AXE_DERIVE' && i.message.includes('Digital'))).toBe(true);
    expect(insights.some((i) => i.code === 'CONCENTRATION' && i.message.includes('Filiale A'))).toBe(true);
  });
  it('reste silencieux sur un plan sain', () => {
    const actions = [base({ avancement: 55 }), base({ id: 'a2', avancement: 60, responsable: 'K. N.' })];
    expect(computeInsights(actions, TODAY)).toHaveLength(0);
  });
});
