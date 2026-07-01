'use client';

import { useMemo, useState } from 'react';
import type { ActionDTO } from '@/lib/types';
import { construireArbre, type ArbreNoeud } from '@/lib/tree';
import { niveauLabel } from '@/lib/constants';
import { StatutBadge, RetardBadge } from '@/components/ui/Badges';
import { ProgressBar } from '@/components/ui/ProgressBar';

/**
 * Vue arborescente repliable des actions (Pilier › Axe › Projet › Action ›
 * Sous-action). Rendu pur à partir de la liste plate reçue en props.
 */
export function ActionsTree({
  rows,
  canEdit,
  onEdit,
  onAddChild,
  onDelete,
}: {
  rows: ActionDTO[];
  canEdit: boolean;
  onEdit: (a: ActionDTO) => void;
  onAddChild: (parent: ActionDTO) => void;
  onDelete: (a: ActionDTO) => void;
}) {
  const foret = useMemo(() => construireArbre(rows), [rows]);
  const [replies, setReplies] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (rows.length === 0) {
    return <div className="card p-12 text-center text-slate-400">Aucune action à afficher.</div>;
  }

  const rendreNoeud = (n: ArbreNoeud<ActionDTO>): React.ReactNode => {
    const aEnfants = n.enfants.length > 0;
    const replie = replies.has(n.id);
    return (
      <li key={n.id}>
        <div
          className="flex items-center gap-2 border-b border-slate-100 py-2 hover:bg-slate-50/60"
          style={{ paddingLeft: `${n.profondeur * 20 + 8}px` }}
        >
          {aEnfants ? (
            <button
              type="button"
              onClick={() => toggle(n.id)}
              className="w-5 shrink-0 text-slate-400 hover:text-ink"
              aria-label={replie ? 'Déplier' : 'Replier'}
            >
              {replie ? '▸' : '▾'}
            </button>
          ) : (
            <span className="w-5 shrink-0 text-center text-slate-300">·</span>
          )}
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {niveauLabel(n.niveau).replace(/\s*\(.*\)/, '')}
          </span>
          <span className="min-w-0 grow truncate font-semibold text-ink" title={n.titre}>
            {n.titre}
          </span>
          <span className="hidden w-40 shrink-0 md:block">
            <ProgressBar value={n.avancement} color={n.enRetard ? '#E8A13D' : '#1E4FD8'} />
          </span>
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            <StatutBadge statut={n.statut} />
            {n.enRetard && <RetardBadge />}
          </span>
          {canEdit && (
            <span className="flex shrink-0 items-center gap-2 pr-2 text-xs font-semibold">
              <button onClick={() => onAddChild(n)} className="text-accent hover:underline" title="Ajouter un enfant">+ Enfant</button>
              <button onClick={() => onEdit(n)} className="text-accent hover:underline">Éditer</button>
              <button onClick={() => onDelete(n)} className="text-statut-rouge hover:underline">Suppr.</button>
            </span>
          )}
        </div>
        {aEnfants && !replie && <ul>{n.enfants.map(rendreNoeud)}</ul>}
      </li>
    );
  };

  return (
    <div className="card overflow-x-auto">
      <ul>{foret.map(rendreNoeud)}</ul>
    </div>
  );
}
