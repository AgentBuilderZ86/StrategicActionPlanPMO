'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionCard } from '@/components/ui/Cards';
import { fmtDate } from '@/lib/utils';

type AuditRow = {
  id: string;
  userEmail: string | null;
  action: string;
  entite: string;
  entiteId: string | null;
  ip: string | null;
  createdAt: string;
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE'];
const ENTITES = ['Action', 'Axe', 'Pays', 'Entite', 'Plan', 'User', 'Snapshot', 'Auth'];

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  IMPORT: 'Import',
  LOGIN_SUCCESS: 'Connexion',
  LOGIN_FAILURE: 'Échec connexion',
};

/** Journal d'audit consultable par l'administrateur (T0.4, exig. 33 & 35). */
export function AuditJournal() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [action, setAction] = useState('');
  const [entite, setEntite] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (action) p.set('action', action);
    if (entite) p.set('entite', entite);
    const res = await fetch(`/api/audit?${p.toString()}`, { cache: 'no-store' });
    const body = await res.json();
    setRows(body.data ?? []);
    setTotalPages(body.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [action, entite, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <SectionCard title="Journal d'audit" subtitle="Traçabilité des connexions et des écritures (réservé aux administrateurs).">
      <div className="mb-3 flex flex-wrap gap-2">
        <select className="input w-auto" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} aria-label="Filtrer par action">
          <option value="">Toutes les actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>)}
        </select>
        <select className="input w-auto" value={entite} onChange={(e) => { setPage(1); setEntite(e.target.value); }} aria-label="Filtrer par entité">
          <option value="">Toutes les entités</option>
          {ENTITES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="ml-auto self-center text-xs text-slate-400">{loading ? 'Chargement…' : `${rows.length} entrée(s)`}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="th">Date</th>
              <th className="th">Utilisateur</th>
              <th className="th">Action</th>
              <th className="th">Entité</th>
              <th className="th">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="td whitespace-nowrap text-xs text-slate-500">{fmtDate(r.createdAt)}</td>
                <td className="td text-xs text-ink">{r.userEmail ?? '—'}</td>
                <td className="td text-xs font-semibold">{ACTION_LABEL[r.action] ?? r.action}</td>
                <td className="td text-xs">{r.entite}{r.entiteId ? ` · ${r.entiteId.slice(0, 8)}…` : ''}</td>
                <td className="td text-xs text-slate-400">{r.ip ?? '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="td py-8 text-center text-slate-400">Aucune entrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-3 py-1.5 disabled:opacity-40">Précédent</button>
          <span className="text-slate-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-3 py-1.5 disabled:opacity-40">Suivant</button>
        </div>
      )}
    </SectionCard>
  );
}
