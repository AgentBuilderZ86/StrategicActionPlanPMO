// Construction des jeux de données de reporting (T3.2, exig. 22, 28).
// Pur et testable ; consommé pour les exports XLSX/PDF.
import type { Kpis, DimAgg } from './aggregations';

export type FeuilleRapport = {
  nom: string;
  entetes: string[];
  lignes: (string | number)[][];
};

const pct = (n: number) => `${Math.round(n)} %`;
const tauxConso = (budget: number, conso: number) => (budget > 0 ? Math.round((conso / budget) * 100) : 0);

/** Feuille de synthèse : indicateurs clés du plan. */
export function feuilleSynthese(kpis: Kpis): FeuilleRapport {
  const consoPct = tauxConso(kpis.budgetTotal, kpis.budgetConso);
  return {
    nom: 'Synthèse',
    entetes: ['Indicateur', 'Valeur'],
    lignes: [
      ['Nombre d’actions', kpis.total],
      ['Avancement moyen', pct(kpis.avancementMoyen)],
      ['Actions terminées', kpis.terminees],
      ['Actions en cours', kpis.enCours],
      ['Actions bloquées', kpis.bloquees],
      ['Actions en retard', kpis.enRetard],
      ['Budget total (k MAD)', kpis.budgetTotal],
      ['Budget consommé (k MAD)', kpis.budgetConso],
      ['Taux de consommation', pct(consoPct)],
    ],
  };
}

/** Feuille d'agrégation par dimension (axe ou région). */
export function feuilleDimension(nom: string, entete: string, dims: DimAgg[]): FeuilleRapport {
  return {
    nom,
    entetes: [entete, 'Actions', 'Avancement', 'Terminées', 'Bloquées', 'En retard', 'Budget (k MAD)', 'Consommé (k MAD)'],
    lignes: dims.map((d) => [
      d.label, d.count, pct(d.avancementMoyen), d.terminees, d.bloquees, d.enRetard, d.budget, d.budgetConso,
    ]),
  };
}

/** Feuille d'exécution budgétaire par axe (taux de consommation). */
export function feuilleBudget(parAxe: DimAgg[]): FeuilleRapport {
  return {
    nom: 'Exécution budgétaire',
    entetes: ['Axe', 'Budget (k MAD)', 'Consommé (k MAD)', 'Reste (k MAD)', 'Taux'],
    lignes: parAxe.map((d) => [
      d.label, d.budget, d.budgetConso, d.budget - d.budgetConso, pct(tauxConso(d.budget, d.budgetConso)),
    ]),
  };
}

/** Assemble l'ensemble des feuilles d'un rapport de pilotage. */
export function construireRapport(data: { kpis: Kpis; parAxe: DimAgg[]; parPays: DimAgg[] }): FeuilleRapport[] {
  return [
    feuilleSynthese(data.kpis),
    feuilleDimension('Par axe', 'Axe stratégique', data.parAxe),
    feuilleDimension('Par région', 'Région', data.parPays),
    feuilleBudget(data.parAxe),
  ];
}
