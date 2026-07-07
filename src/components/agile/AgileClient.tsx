'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  KANBAN_COLONNES, KANBAN_LABEL, SPRINT_STATUTS, SPRINT_STATUT_LABEL,
  canEditClient, type KanbanColonne, type Role,
} from '@/lib/constants';
import { SectionCard } from '@/components/ui/Cards';
import { Onglets } from '@/components/ui/Onglets';
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
  const [onglet, setOnglet] = useState<'board' | 'graphiques' | 'sprints'>('board');
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

  const sprintEnCours = sprints.find((sp) => sp.statut === 'EN_COURS') ?? null;
  const derniereVelocite = [...velocity].reverse().find((v) => v.points > 0) ?? null;
  const pointsRestants = sprintEnCours
    ? items.filter((it) => it.sprintId === sprintEnCours.id && it.statut !== 'TERMINE').reduce((s2, it) => s2 + (it.points ?? 0), 0)
    : 0;
  const pointsTermines = items.filter((it) => it.statut === 'TERMINE').reduce((s2, it) => s2 + (it.points ?? 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {!estSI && (
        <div className="card px-4 py-2.5 text-xs text-ink">
          Ce plan n&apos;est pas de type « PMO SI ». Le volet Sprints reste disponible mais est surtout pertinent pour les plans SI.
        </div>
      )}

      {/* Tuiles d'exécution */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="tuile tuile-dsi">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Sprint en cours</div>
          <div className="mt-1 truncate font-mono text-lg font-bold">{sprintEnCours?.nom ?? '—'}</div>
          <div className="text-[10px] text-white/70">{sprints.length} sprint(s) au total</div>
        </div>
        <div className="tuile tuile-cyan">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Reste à faire</div>
          <div className="mt-1 font-mono text-lg font-bold">{pointsRestants} pts</div>
          <div className="text-[10px] text-white/70">sur le sprint en cours</div>
        </div>
        <div className="tuile tuile-emeraude">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Dernière vélocité</div>
          <div className="mt-1 font-mono text-lg font-bold">{derniereVelocite ? `${derniereVelocite.points} pts` : '—'}</div>
          <div className="text-[10px] text-white/70">{derniereVelocite?.sprint ?? 'aucun sprint terminé'}</div>
        </div>
        <div className="tuile tuile-sombre">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Terminé (cumul)</div>
          <div className="mt-1 font-mono text-lg font-bold">{pointsTermines} pts</div>
          <div className="text-[10px] text-white/70">{items.length} items au board</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Onglets
          onglets={[
            { key: 'board', label: 'Board' },
            { key: 'graphiques', label: 'Graphiques' },
            { key: 'sprints', label: `Sprints (${sprints.length})` },
          ]}
          actif={onglet}
          onChange={setOnglet}
        />
        {onglet === 'board' && (
          <>
            <select aria-label="Périmètre" className="input !w-auto !py-1.5 text-xs" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="TOUS">Tous les items</option>
              <option value="BACKLOG">Backlog (non affectés)</option>
              {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.nom}</option>)}
            </select>
            {canEdit && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <input className="input !w-56 !py-1.5 text-xs" placeholder="Nouvel item / user story…" value={nouvelItem.titre}
                  onChange={(e) => setNouvelItem({ ...nouvelItem, titre: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && ajouterItem()} />
                <input className="input !w-16 !py-1.5 text-xs" type="number" min={0} placeholder="pts" value={nouvelItem.points}
                  onChange={(e) => setNouvelItem({ ...nouvelItem, points: e.target.value })} />
                <button onClick={ajouterItem} className="btn-primary !py-1.5 text-xs">Ajouter</button>
              </div>
            )}
          </>
        )}
      </div>

      {onglet === 'board' && (
        <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto pb-2">
          {KANBAN_COLONNES.map((col) => {
            const cards = itemsBoard.filter((it) => it.statut === col);
            const idx = KANBAN_COLONNES.indexOf(col);
            return (
              <div key={col} className="flex w-[210px] min-w-[210px] flex-col rounded-xl bg-white/50 p-2 backdrop-blur">
                <div className="flex items-center justify-between px-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <span>{KANBAN_LABEL[col]}</span>
                  <span className="rounded-full bg-white px-1.5 font-mono text-ink">{cards.length}</span>
                </div>
                <ul className="scrolly flex-1 space-y-2">
                  {cards.map((it) => (
                    <li key={it.id} className="card p-2.5">
                      <div className="text-xs font-semibold leading-snug text-ink">{it.titre}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        {it.points != null && <span className="rounded bg-blue-50 px-1.5 font-mono font-bold text-statut-bleu">{it.points} pts</span>}
                        {it.assigne && <span className="truncate">{it.assigne}</span>}
                      </div>
                      {canEdit && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <button onClick={() => bougerItem(it, -1)} disabled={idx === 0} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Colonne précédente">◀</button>
                          <button onClick={() => bougerItem(it, 1)} disabled={idx === KANBAN_COLONNES.length - 1} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Colonne suivante">▶</button>
                          <select aria-label="Sprint" className="input ml-auto !w-auto !py-0.5 text-[10px]" value={it.sprintId ?? ''} onChange={(e) => affecterSprint(it, e.target.value)}>
                            <option value="">Backlog</option>
                            {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.nom}</option>)}
                          </select>
                          <button onClick={() => supprimerItem(it.id)} className="text-statut-rouge" aria-label="Supprimer">✕</button>
                        </div>
                      )}
                    </li>
                  ))}
                  {cards.length === 0 && <li className="px-1 py-4 text-center text-[10px] text-slate-300">—</li>}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {onglet === 'graphiques' && (
        <div className="grid min-h-0 flex-1 content-start gap-3 lg:grid-cols-2">
          <SectionCard title="Velocity" subtitle="Points terminés par sprint"><VelocityChart data={velocity} /></SectionCard>
          <SectionCard title="Cumulative Flow" subtitle="Répartition des items par colonne (périmètre courant)"><CFDChart data={cfd} /></SectionCard>
          <SectionCard title="Burndown" subtitle={sprintSelectionne ? `Sprint « ${sprintSelectionne.nom} »` : 'Sélectionnez un sprint dans le Board'}>
            <BurndownChart data={burndown} />
          </SectionCard>
        </div>
      )}

      {onglet === 'sprints' && (
        <div className="card card-liseret flex min-h-0 flex-1 flex-col p-4">
          <div className="scrolly space-y-2">
            {sprints.map((sp) => (
              <div key={sp.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-canvas px-3 py-2 text-xs">
                <span className="font-semibold text-ink">{sp.nom}</span>
                <span className="text-slate-400">{sp.dateDebut?.slice(0, 10) ?? '—'} → {sp.dateFin?.slice(0, 10) ?? '—'}</span>
                {canEdit ? (
                  <select aria-label="Statut du sprint" className="input ml-auto !w-auto !py-0.5 text-xs" value={sp.statut} onChange={(e) => majSprintStatut(sp.id, e.target.value)}>
                    {SPRINT_STATUTS.map((st) => <option key={st} value={st}>{SPRINT_STATUT_LABEL[st]}</option>)}
                  </select>
                ) : <span className="ml-auto text-slate-400">{SPRINT_STATUT_LABEL[sp.statut as keyof typeof SPRINT_STATUT_LABEL] ?? sp.statut}</span>}
              </div>
            ))}
            {sprints.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Aucun sprint.</p>}
          </div>
          {canEdit && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-ligne/60 pt-3">
              <input className="input !py-1.5 text-xs grow" placeholder="Nom du sprint…" value={nouveauSprint.nom} onChange={(e) => setNouveauSprint({ ...nouveauSprint, nom: e.target.value })} />
              <input className="input !w-auto !py-1.5 text-xs" type="date" aria-label="Début" value={nouveauSprint.dateDebut} onChange={(e) => setNouveauSprint({ ...nouveauSprint, dateDebut: e.target.value })} />
              <input className="input !w-auto !py-1.5 text-xs" type="date" aria-label="Fin" value={nouveauSprint.dateFin} onChange={(e) => setNouveauSprint({ ...nouveauSprint, dateFin: e.target.value })} />
              <button onClick={creerSprint} className="btn-primary !py-1.5 text-xs">+ Sprint</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
