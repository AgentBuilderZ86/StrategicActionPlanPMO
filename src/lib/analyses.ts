import { aggregateByDimension, type AggAction, type DimAgg } from './aggregations';
import { PRIORITE_LABEL, type DimensionKey, type Priorite } from './constants';
import { moyenne } from './utils';

type Accessor = { keyOf: (a: AggAction) => string; labelOf: (a: AggAction) => string };

export function accessorFor(dim: DimensionKey): Accessor {
  switch (dim) {
    case 'pays':
      return { keyOf: (a) => a.paysId, labelOf: (a) => a.pays ?? '—' };
    case 'entite':
      return { keyOf: (a) => a.entiteId, labelOf: (a) => a.entite ?? '—' };
    case 'axe':
      return { keyOf: (a) => a.axeId, labelOf: (a) => a.axe ?? '—' };
    case 'responsable':
      return { keyOf: (a) => a.responsable ?? '—', labelOf: (a) => a.responsable ?? '—' };
    case 'priorite':
      return {
        keyOf: (a) => a.priorite,
        labelOf: (a) => PRIORITE_LABEL[a.priorite as Priorite] ?? a.priorite,
      };
  }
}

export function pivot(actions: AggAction[], dim: DimensionKey): DimAgg[] {
  const acc = accessorFor(dim);
  return aggregateByDimension(actions, acc.keyOf, acc.labelOf);
}

export type CrossCell = { count: number; avancement: number };
export type CrossMatrix = {
  rows: { key: string; label: string }[];
  cols: { key: string; label: string }[];
  cells: Record<string, Record<string, CrossCell>>;
};

export function crossMatrix(
  actions: AggAction[],
  dim1: DimensionKey,
  dim2: DimensionKey,
): CrossMatrix {
  const a1 = accessorFor(dim1);
  const a2 = accessorFor(dim2);
  const rowsMap = new Map<string, string>();
  const colsMap = new Map<string, string>();
  for (const a of actions) {
    rowsMap.set(a1.keyOf(a), a1.labelOf(a));
    colsMap.set(a2.keyOf(a), a2.labelOf(a));
  }
  const cells: Record<string, Record<string, CrossCell>> = {};
  for (const [rk] of rowsMap) {
    cells[rk] = {};
    for (const [ck] of colsMap) {
      const subset = actions.filter((a) => a1.keyOf(a) === rk && a2.keyOf(a) === ck);
      cells[rk]![ck] = { count: subset.length, avancement: Math.round(moyenne(subset.map((a) => a.avancement))) };
    }
  }
  return {
    rows: [...rowsMap].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label)),
    cols: [...colsMap].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label)),
    cells,
  };
}
