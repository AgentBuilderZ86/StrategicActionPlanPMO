import { describe, it, expect } from 'vitest';
import { actionCreateSchema, importRowSchema } from './zod';

describe('actionCreateSchema', () => {
  const base = {
    titre: 'Test',
    planId: 'plan1',
    axeId: 'ax1',
    paysId: 'p1',
    entiteId: 'e1',
    responsable: 'X',
  };

  it('accepte une action minimale et applique les défauts', () => {
    const r = actionCreateSchema.parse(base);
    expect(r.statut).toBe('A_LANCER');
    expect(r.priorite).toBe('MOYENNE');
    expect(r.avancement).toBe(0);
  });

  it('rejette un titre vide', () => {
    expect(() => actionCreateSchema.parse({ ...base, titre: '' })).toThrow();
  });

  it('rejette un avancement hors bornes', () => {
    expect(() => actionCreateSchema.parse({ ...base, avancement: 150 })).toThrow();
  });

  it('transforme les dates ISO en Date et les vides en null', () => {
    const r = actionCreateSchema.parse({ ...base, dateFin: '2026-06-30', dateDebut: '' });
    expect(r.dateFin).toBeInstanceOf(Date);
    expect(r.dateDebut).toBeNull();
  });

  it('coerce le budget numérique et null si vide', () => {
    expect(actionCreateSchema.parse({ ...base, budget: '120' }).budget).toBe(120);
    expect(actionCreateSchema.parse({ ...base, budget: '' }).budget).toBeNull();
  });

  it('rejette un statut inconnu', () => {
    expect(() => actionCreateSchema.parse({ ...base, statut: 'XXX' })).toThrow();
  });
});

describe('importRowSchema', () => {
  it('exige les colonnes requises', () => {
    expect(importRowSchema.safeParse({ titre: 'T' }).success).toBe(false);
    expect(
      importRowSchema.safeParse({ titre: 'T', axe: 'A', pays: 'P', entite: 'E', responsable: 'R' }).success,
    ).toBe(true);
  });
});
