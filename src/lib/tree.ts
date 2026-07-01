// Utilitaires d'arborescence (purs, testables, sans dépendance Prisma) —
// support de l'arbre parent-enfant des actions (T0.1, exig. 2 & 3).

export type NoeudBase = { id: string; parentId?: string | null; ordre?: number | null };

export type ArbreNoeud<T extends NoeudBase> = T & {
  enfants: ArbreNoeud<T>[];
  profondeur: number;
};

/**
 * Reconstruit une forêt (liste de racines) à partir d'une liste plate.
 * - Les enfants sont triés par `ordre` puis, à défaut, par `id` (stable).
 * - Un nœud dont le `parentId` référence un parent absent de la liste est
 *   traité comme une racine (robustesse : périmètre filtré, parent hors page).
 * - Les cycles éventuels sont ignorés (un nœud n'est rattaché qu'une fois).
 */
export function construireArbre<T extends NoeudBase>(items: T[]): ArbreNoeud<T>[] {
  const parId = new Map<string, ArbreNoeud<T>>();
  for (const item of items) {
    parId.set(item.id, { ...item, enfants: [], profondeur: 0 });
  }

  const racines: ArbreNoeud<T>[] = [];
  for (const noeud of parId.values()) {
    const pid = noeud.parentId ?? null;
    const parent = pid ? parId.get(pid) : undefined;
    if (parent && parent.id !== noeud.id) {
      parent.enfants.push(noeud);
    } else {
      racines.push(noeud);
    }
  }

  const trier = (liste: ArbreNoeud<T>[], profondeur: number) => {
    liste.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.id.localeCompare(b.id));
    for (const n of liste) {
      n.profondeur = profondeur;
      trier(n.enfants, profondeur + 1);
    }
  };
  trier(racines, 0);
  return racines;
}

/** Aplatit une forêt en liste en profondeur d'abord (ordre d'affichage). */
export function aplatirArbre<T extends NoeudBase>(racines: ArbreNoeud<T>[]): ArbreNoeud<T>[] {
  const out: ArbreNoeud<T>[] = [];
  const visiter = (n: ArbreNoeud<T>) => {
    out.push(n);
    for (const e of n.enfants) visiter(e);
  };
  for (const r of racines) visiter(r);
  return out;
}

/** Niveau attendu d'un enfant selon la règle `niveau(enfant) = niveau(parent) + 1`. */
export function niveauEnfantAttendu(niveauParent: number): number {
  return niveauParent + 1;
}

/** Vérifie la règle de cohérence de niveau entre un parent et son enfant. */
export function niveauCoherent(niveauParent: number, niveauEnfant: number): boolean {
  return niveauEnfant === niveauEnfantAttendu(niveauParent);
}

/** Collecte les identifiants d'un nœud et de tous ses descendants. */
export function idsDescendants<T extends NoeudBase>(racine: ArbreNoeud<T>): string[] {
  return aplatirArbre([racine]).map((n) => n.id);
}
