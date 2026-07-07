'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { STATUTS, PRIORITES, STATUT_LABEL, PRIORITE_LABEL, canEditClient, type Role } from '@/lib/constants';
import type { ActionDTO, Pagination, Referentiels } from '@/lib/types';
import { fmtDate, fmtMoney, cn } from '@/lib/utils';
import { StatutBadge, PrioriteBadge, RetardBadge } from '@/components/ui/Badges';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Drawer } from '@/components/ui/Drawer';
import { ActionForm, type ParentOption } from './ActionForm';
import { ActionsTree } from './ActionsTree';

const EMPTY_FILTERS = { q: '', axeId: '', paysId: '', entiteId: '', statut: '', priorite: '', enRetard: false };

type SortKey = 'titre' | 'statut' | 'avancement' | 'priorite' | 'dateFin' | 'budget' | 'updatedAt';

export function ActionsClient({ planId, referentiels }: { planId: string; referentiels: Referentiels }) {
  const { data: session } = useSession();
  const canEdit = canEditClient((session?.user as { role?: Role } | undefined)?.role);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('updatedAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ActionDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ActionDTO | null>(null);
  const [view, setView] = useState<'table' | 'arbre'>('table');
  const [treeRows, setTreeRows] = useState<ActionDTO[]>([]);
  const [parentDefaut, setParentDefaut] = useState<ParentOption | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ planId, sort, dir, page: String(page), pageSize: '50' });
    if (filters.q) p.set('q', filters.q);
    if (filters.axeId) p.set('axeId', filters.axeId);
    if (filters.paysId) p.set('paysId', filters.paysId);
    if (filters.entiteId) p.set('entiteId', filters.entiteId);
    if (filters.statut) p.set('statut', filters.statut);
    if (filters.priorite) p.set('priorite', filters.priorite);
    if (filters.enRetard) p.set('enRetard', '1');
    const res = await fetch(`/api/actions?${p.toString()}`, { cache: 'no-store' });
    const body = await res.json();
    setRows(body.data ?? []);
    setPagination(body.pagination ?? null);
    setLoading(false);
  }, [planId, sort, dir, page, filters]);

  // Vue arbre : on charge tout le plan (sans pagination) pour reconstruire l'arbre.
  const loadTree = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/actions?planId=${planId}&sort=updatedAt&dir=desc&page=1&pageSize=1000`,
      { cache: 'no-store' },
    );
    const body = await res.json();
    setTreeRows(body.data ?? []);
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    if (view === 'arbre') {
      loadTree();
      return;
    }
    const t = setTimeout(load, filters.q ? 250 : 0); // debounce de la recherche texte
    return () => clearTimeout(t);
  }, [view, load, loadTree, filters.q]);

  // Ouverture directe d'une action via ?focus=<id> (liens depuis notifications,
  // validations, palette de commandes). Lu une seule fois au montage.
  useEffect(() => {
    const focusId = new URLSearchParams(window.location.search).get('focus');
    if (!focusId) return;
    let cancelled = false;
    fetch(`/api/actions/${focusId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => {
        if (a && !cancelled) { setEditing(a); setParentDefaut(null); setDrawerOpen(true); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentOptions: ParentOption[] = treeRows.map((a) => ({ id: a.id, titre: a.titre, niveau: a.niveau }));

  const reload = () => (view === 'arbre' ? loadTree() : load());

  const setFilter = (patch: Partial<typeof EMPTY_FILTERS>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setDir('asc'); }
  };

  const openNew = () => { setEditing(null); setParentDefaut(null); setDrawerOpen(true); };
  const openEdit = (a: ActionDTO) => { setEditing(a); setParentDefaut(null); setDrawerOpen(true); };
  const openChild = (parent: ActionDTO) => {
    setEditing(null);
    setParentDefaut({ id: parent.id, titre: parent.titre, niveau: parent.niveau });
    setDrawerOpen(true);
  };

  const handleSaved = () => { setDrawerOpen(false); setEditing(null); setParentDefaut(null); reload(); };

  const handleDelete = async (a: ActionDTO) => {
    if (!window.confirm(`Supprimer l’action « ${a.titre} » et sa descendance ?`)) return;
    await fetch(`/api/actions/${a.id}`, { method: 'DELETE' });
    reload();
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="th cursor-pointer select-none" onClick={() => toggleSort(k)} aria-sort={sort === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === k && <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <input
          className="input min-w-[180px] grow"
          placeholder="Rechercher (titre, responsable, commentaire)…"
          value={filters.q}
          onChange={(e) => setFilter({ q: e.target.value })}
          aria-label="Recherche"
        />
        <select className="input w-auto" value={filters.axeId} onChange={(e) => setFilter({ axeId: e.target.value })} aria-label="Filtrer par axe">
          <option value="">Tous les axes</option>
          {referentiels.axes.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
        <select className="input w-auto" value={filters.paysId} onChange={(e) => setFilter({ paysId: e.target.value })} aria-label="Filtrer par région">
          <option value="">Toutes les régions</option>
          {referentiels.pays.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
        <select className="input w-auto" value={filters.entiteId} onChange={(e) => setFilter({ entiteId: e.target.value })} aria-label="Filtrer par pôle ou partenaire">
          <option value="">Tous les pôles / partenaires</option>
          {referentiels.entites.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
        <select className="input w-auto" value={filters.statut} onChange={(e) => setFilter({ statut: e.target.value })} aria-label="Filtrer par statut">
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
        </select>
        <select className="input w-auto" value={filters.priorite} onChange={(e) => setFilter({ priorite: e.target.value })} aria-label="Filtrer par priorité">
          <option value="">Toutes priorités</option>
          {PRIORITES.map((p) => <option key={p} value={p}>{PRIORITE_LABEL[p]}</option>)}
        </select>
        <label className="flex items-center gap-1.5 px-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={filters.enRetard} onChange={(e) => setFilter({ enRetard: e.target.checked })} className="accent-[#D64545]" />
          En retard
        </label>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setView('table')}
              className={cn('px-3 py-1.5', view === 'table' ? 'bg-accent text-white' : 'bg-white text-slate-500')}
            >
              Table
            </button>
            <button
              onClick={() => setView('arbre')}
              className={cn('px-3 py-1.5', view === 'arbre' ? 'bg-accent text-white' : 'bg-white text-slate-500')}
            >
              Arborescence
            </button>
          </div>
          {canEdit && <button onClick={openNew} className="btn-primary">+ Nouvelle action</button>}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{(view === 'arbre' ? treeRows.length : pagination?.total ?? 0)} action(s){loading ? ' · chargement…' : ''}</span>
      </div>

      {view === 'arbre' && (
        <ActionsTree
          rows={treeRows}
          canEdit={canEdit}
          onEdit={openEdit}
          onAddChild={openChild}
          onDelete={handleDelete}
        />
      )}

      {/* Table */}
      {view === 'table' && (
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <SortHeader k="titre" label="Action" />
              <th className="th">Région / Pôle</th>
              <th className="th">Resp.</th>
              <SortHeader k="statut" label="Statut" />
              <SortHeader k="priorite" label="Priorité" />
              <SortHeader k="avancement" label="Avancement" />
              <SortHeader k="dateFin" label="Échéance" />
              <SortHeader k="budget" label="Budget" />
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="td max-w-xs">
                  <div className="font-semibold text-ink">
                    {a.code && <span className="mr-1.5 font-mono text-xs font-semibold text-accent">{a.code}</span>}
                    {a.titre}
                  </div>
                  <div className="text-xs text-slate-400">{a.axe}</div>
                </td>
                <td className="td text-xs">
                  <div className="font-medium text-ink">{a.pays}</div>
                  <div className="text-slate-400">{a.entite}</div>
                </td>
                <td className="td text-xs text-ink">{a.responsable}</td>
                <td className="td">
                  <div className="flex flex-col items-start gap-1">
                    <StatutBadge statut={a.statut} />
                    {a.enRetard && <RetardBadge />}
                  </div>
                </td>
                <td className="td"><PrioriteBadge priorite={a.priorite} /></td>
                <td className="td w-44"><ProgressBar value={a.avancement} color={a.enRetard ? '#E8A13D' : '#1E4FD8'} /></td>
                <td className={cn('td whitespace-nowrap text-xs', a.enRetard ? 'font-semibold text-statut-rouge' : 'text-ink')}>{fmtDate(a.dateFin)}</td>
                <td className="td whitespace-nowrap text-xs font-semibold tabular-nums text-ink">{fmtMoney(a.budget)}</td>
                <td className="td whitespace-nowrap text-right">
                  {canEdit ? (
                    <>
                      <button onClick={() => openEdit(a)} className="mr-2 text-xs font-semibold text-accent hover:underline">Éditer</button>
                      <button onClick={() => handleDelete(a)} className="text-xs font-semibold text-statut-rouge hover:underline">Suppr.</button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="td py-12 text-center text-slate-400">Aucune action ne correspond aux filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {view === 'table' && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-3 py-1.5 disabled:opacity-40">Précédent</button>
          <span className="text-slate-500">Page {pagination.page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-3 py-1.5 disabled:opacity-40">Suivant</button>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Modifier l'action" : 'Nouvelle action'}>
        {drawerOpen && (
          <ActionForm
            planId={planId}
            action={editing}
            referentiels={referentiels}
            parents={parentOptions}
            parentDefaut={parentDefaut}
            onSaved={handleSaved}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
      </Drawer>
    </div>
  );
}
