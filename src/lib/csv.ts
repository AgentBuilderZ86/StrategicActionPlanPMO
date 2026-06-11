import { STATUT_LABEL, PRIORITE_LABEL, type Statut, type Priorite } from './constants';
import type { ActionDTO } from './types';

export const EXPORT_HEADERS = [
  'Titre',
  'Axe',
  'Pays',
  'Entité',
  'Responsable',
  'Statut',
  'Avancement',
  'Priorité',
  'Début',
  'Fin',
  'Budget (k€)',
  'Conso (k€)',
  'En retard',
  'Commentaire',
] as const;

export function actionToRow(a: ActionDTO): (string | number)[] {
  return [
    a.titre,
    a.axe,
    a.pays,
    a.entite,
    a.responsable,
    STATUT_LABEL[a.statut as Statut] ?? a.statut,
    a.avancement,
    PRIORITE_LABEL[a.priorite as Priorite] ?? a.priorite,
    a.dateDebut ? a.dateDebut.slice(0, 10) : '',
    a.dateFin ? a.dateFin.slice(0, 10) : '',
    a.budget ?? '',
    a.budgetConso ?? '',
    a.enRetard ? 'Oui' : 'Non',
    a.commentaire ?? '',
  ];
}

/** CSV format FR : séparateur « ; », BOM UTF-8. */
export function toCSV(actions: ActionDTO[]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    EXPORT_HEADERS.join(';'),
    ...actions.map((a) => actionToRow(a).map(esc).join(';')),
  ];
  return '﻿' + lines.join('\r\n');
}
