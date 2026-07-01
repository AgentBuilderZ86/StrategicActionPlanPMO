// Consolidation ascendante des indicateurs dans l'arbre (T1.2, exig. 11, 13, 14).
// Pur et testable : aucune dépendance Prisma.

export type IndicateurLigne = {
  actionId: string;
  libelle: string;
  unite?: string | null;
  cible?: number | null;
  realise?: number | null;
  sens?: string | null;
  agregeable?: boolean;
};

export type IndicateurConsolide = {
  libelle: string;
  unite: string | null;
  cible: number | null;
  realise: number | null;
  // Taux d'atteinte de la cible en %, tenant compte du sens d'amélioration.
  tauxRealisation: number | null;
  sens: string;
  nbSources: number;
};

/** Taux d'atteinte (%) d'une cible, selon le sens d'amélioration. */
export function tauxRealisation(
  cible: number | null | undefined,
  realise: number | null | undefined,
  sens: string | null | undefined,
): number | null {
  if (cible == null || realise == null) return null;
  if (sens === 'BAISSE') {
    // « moins = mieux » : atteint à 100 % si réalisé ≤ cible.
    if (realise <= 0) return cible <= 0 ? 100 : 100;
    return Math.round(Math.min(100, (cible / realise) * 100));
  }
  if (cible === 0) return realise >= 0 ? 100 : 0;
  return Math.round(Math.min(100, (realise / cible) * 100));
}

/**
 * Consolide une liste d'indicateurs (issus d'un nœud et de ses descendants) en
 * regroupant par libellé + unité. Les cibles/réalisés agrégeables sont sommés ;
 * le sens d'amélioration retenu est celui de la première occurrence.
 */
export function consoliderIndicateurs(lignes: IndicateurLigne[]): IndicateurConsolide[] {
  const groupes = new Map<string, IndicateurLigne[]>();
  for (const l of lignes) {
    if (l.agregeable === false) continue;
    const cle = `${l.libelle.trim().toLowerCase()}|${(l.unite ?? '').trim().toLowerCase()}`;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(l);
  }

  return [...groupes.values()].map((items) => {
    const premier = items[0]!;
    const cibles = items.map((i) => i.cible).filter((v): v is number => v != null);
    const realises = items.map((i) => i.realise).filter((v): v is number => v != null);
    const cible = cibles.length ? cibles.reduce((s, v) => s + v, 0) : null;
    const realise = realises.length ? realises.reduce((s, v) => s + v, 0) : null;
    const sens = premier.sens ?? 'HAUSSE';
    return {
      libelle: premier.libelle,
      unite: premier.unite ?? null,
      cible,
      realise,
      tauxRealisation: tauxRealisation(cible, realise, sens),
      sens,
      nbSources: items.length,
    };
  }).sort((a, b) => a.libelle.localeCompare(b.libelle));
}
