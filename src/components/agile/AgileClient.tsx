'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  KANBAN_COLONNES, KANBAN_LABEL, SPRINT_STATUTS, SPRINT_STATUT_LABEL,
  canEditClient, type KanbanColonne, type Role,
} from '@/lib/constants';
import { SectionCard } from '@/components/ui/Cards';
import { computeVelocity, computeCFD, computeBurndown } from '@/lib/agile';
import { VelocityChart, CFDChart, BurndownChart } from './AgileCharts';

type Sprint = { id: string; nom: string; objectif: string | null; dateDebut: string | null; dateFin: string | null; statut: string; ordre: number };
type Item = { id: string; sprintId: string | null; titre: string; statut: string; points: number | null; assigne: string | null; ordre: number };

async function jset(url: string, method: string, body?: unknown) {
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
}

export function AgileClient({ planId, estSI }: { planId: string; estSI: boolean }) {
  const { data: session } = useSession();
  const canEdit = canEditClient((session?.user as { role?: Role } | undefined)?.role);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [scope, setScope] = useState<string>('TOUS'); // TOUS | BACKLOG | <sprintId>
  const [nouvelItem, setNouvelItem] = useState({ titre: '', points: '' });
  const [nouveauSprint, setNouveauSprint] = useState({ nom: '', dateDebut: '', dateFin: '' });

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([
      fetch(`/api/sprints?planId=${planId}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/items?planId=${planId}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ]);
    setSprints(s);
    setItems(i);
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const itemsBoard = useMemo(() => {
    if (scope === 'TOUS') return items;
    if (scope === 'BACKLOG') return items.filter((i) => !i.sprintId);
    return items.filter((i) => i.sprintId === scope);
  }, [items, scope]);

  const sprintSelectionne = sprints.find((s) => s.id === scope) ?? null;

  const velocity = useMemo(() => computeVelocity(sprints, items), [sprints, items]);
  const cfd = useMemo(() => computeCFD(itemsBoard), [itemsBoard]);
  const burndown = useMemo(() => (sprintSelectionne ? computeBurndown(sprintSelectionne, items) : []), [sprintSelectionne, items]);

  const bougerItem = async (item: Item, sens: -1 | 1) => {
    const idx = KANBAN_COLONNES.indexOf(item.statut as KanbanColonne);
    const cible = KANBAN_COLONNES[idx + sens];
    if (!cible) return;
    await jset(`/api/items/${item.id}`, 'PATCH', { statut: cible });
    load();
  };
  const affecterSprint = async (item: Item, sprintId: string) => {
    await jset(`/api/items/${item.id}`, 'PATCH', { sprintId: sprintId || null });
    load();
  };
  const supprimerItem = async (id: string) => { await jset(`/api/items/${id}`, 'DELETE'); load(); };

  const ajouterItem = async () => {
    if (!nouvelItem.titre.trim()) return;
    await jset('/api/items', 'POST', {
      planId, titre: nouvelItem.titre.trim(),
      points: nouvelItem.points === '' ? null : Number(nouvelItem.points),
      sprintId: scope !== 'TOUS' && scope !== 'BACKLOG' ? scope : null,
    });
    setNouvelItem({ titre: '', points: '' });
    load();
  };

  const creerSprint = async () => {
    if (!nouveauSprint.nom.trim()) return;
    await jset('/api/sprints', 'POST', { planId, nom: nouveauSprint.nom.trim(), dateDebut: nouveauSprint.dateDebut || null, dateFin: nouveauSprint.dateFin || null });
    setNouveauSprint({ nom: '', dateDebut: '', dateFin: '' });
    load();
  };
  const majSprintStatut = async (id: string, statut: string) => { await jset(`/api/sprints/${id}`, 'PATCH', { statut }); load(); };

  return (
    <div className="space-y-5">
      {!estSI && (
        <div className="card border-statut-ambre/40 bg-statut-ambre/5 p-3 text-xs text-ink">
          Ce plan n’est pas de type « PMO SI ». Le volet Agile reste disponible mais est surtout pertinent pour les plans SI.
        </div>
      )}

      {/* Sprints */}
      <SectionCard title="Sprints" subtitle="Itérations de travail.">
        <div className="mb-3 flex flex-wrap gap-2">
          {sprints.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
              <span className="font-semibold text-ink">{s.nom}</span>
              {canEdit ? (
                <select className="input w-auto py-0.5 text-xs" value={s.statut} onChange={(e) => majSprintStatut(s.id, e.target.value)}>
                  {SPRINT_STATUTS.map((st) => <option key={st} value={st}>{SPRINT_STATUT_LABEL[st]}</option>)}
                </select>
              ) : <span className="text-slate-400">{SPRINT_STATUT_LABEL[s.statut as keyof typeof SPRINT_STATUT_LABEL] ?? s.statut}</span>}
            </div>
          ))}
          {sprints.length === 0 && <span className="text-xs text-slate-400">Aucun sprint.</span>}
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <input className="input grow" placeholder="Nom du sprint…" value={nouveauSprint.nom} onChange={(e) => setNouveauSprint({ ...nouveauSprint, nom: e.target.value })} />
            <input className="input w-auto" type="date" value={nouveauSprint.dateDebut} onChange={(e) => setNouveauSprint({ ...nouveauSprint, dateDebut: e.target.value })} />
            <input className="input w-auto" type="date" value={nouveauSprint.dateFin} onChange={(e) => setNouveauSprint({ ...nouveauSprint, dateFin: e.target.value })} />
            <button onClick={creerSprint} className="btn-ghost">+ Sprint</button>
          </div>
        )}
      </SectionCard>

      {/* Filtre + ajout item */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <select className="input w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="TOUS">Tous les items</option>
          <option value="BACKLOG">Backlog (non affectés)</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        {canEdit && (
          <>
            <input className="input min-w-[160px] grow" placeholder="Nouvel item / user story…" value={nouvelItem.titre} onChange={(e) => setNouvelItem({ ...nouvelItem, titre: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && ajouterItem()} />
            <input className="input w-20" type="number" min={0} placeholder="pts" value={nouvelItem.points} onChange={(e) => setNouvelItem({ ...nouvelItem, points: e.target.value })} />
            <button onClick={ajouterItem} className="btn-primary">Ajouter</button>
          </>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {KANBAN_COLONNES.map((col) => {
          const cards = itemsBoard.filter((i) => i.statut === col);
          return (
            <div key={col} className="rounded-xl bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between px-1 text-xs font-bold text-ink">
                <span>{KANBAN_LABEL[col]}</span>
                <span className="text-slate-400">{cards.length}</span>
              </div>
              <ul className="space-y-2">
                {cards.map((it) => {
                  const idx = KANBAN_COLONNES.indexOf(col);
                  return (
                    <li key={it.id} className="rounded-lg bg-white p-2 shadow-sm">
                      <div className="text-xs font-semibold text-ink">{it.titre}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        {it.points != null && <span className="rounded bg-accent/10 px-1 font-bold text-accent">{it.points} pts</span>}
                        {it.assigne && <span className="truncate">{it.assigne}</span>}
                      </div>
                      {canEdit && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <button onClick={() => bougerItem(it, -1)} disabled={idx === 0} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Colonne précédente">◀</button>
                          <button onClick={() => bougerItem(it, 1)} disabled={idx === KANBAN_COLONNES.length - 1} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Colonne suivante">▶</button>
                          <select className="input ml-auto w-auto py-0.5 text-[10px]" value={it.sprintId ?? ''} onChange={(e) => affecterSprint(it, e.target.value)}>
                            <option value="">Backlog</option>
                            {sprints.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                          </select>
                          <button onClick={() => supprimerItem(it.id)} className="text-statut-rouge" aria-label="Supprimer">✕</button>
                        </div>
                      )}
                    </li>
                  );
                })}
                {cards.length === 0 && <li className="px-1 py-4 text-center text-[10px] text-slate-300">—</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Graphiques agiles */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Velocity" subtitle="Points terminés par sprint"><VelocityChart data={velocity} /></SectionCard>
        <SectionCard title="Cumulative Flow" subtitle="Répartition des items par colonne (périmètre courant)"><CFDChart data={cfd} /></SectionCard>
        <SectionCard title="Burndown" subtitle={sprintSelectionne ? `Sprint « ${sprintSelectionne.nom} »` : 'Sélectionnez un sprint'}>
          <BurndownChart data={burndown} />
        </SectionCard>
      </div>
    </div>
  );
}
