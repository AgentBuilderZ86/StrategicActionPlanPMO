'use client';

import { useCallback, useEffect, useState } from 'react';
import { SENS_INDICATEUR, SENS_LABEL, type SensIndicateur } from '@/lib/constants';

type Indicateur = {
  id: string;
  libelle: string;
  unite: string | null;
  cible: number | null;
  realise: number | null;
  sens: string;
  agregeable: boolean;
};

type Consolide = {
  libelle: string;
  unite: string | null;
  cible: number | null;
  realise: number | null;
  tauxRealisation: number | null;
  nbSources: number;
};

const EMPTY = { libelle: '', unite: '', cible: '', realise: '', sens: 'HAUSSE' as SensIndicateur };

/** Gestion des indicateurs d'un nœud + consolidation ascendante (T1.2). */
export function IndicateursPanel({ actionId, canEdit }: { actionId: string; canEdit: boolean }) {
  const [items, setItems] = useState<Indicateur[]>([]);
  const [consolides, setConsolides] = useState<Consolide[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/actions/${actionId}`, { cache: 'no-store' });
    const body = await res.json();
    setItems(body.indicateurs ?? []);
    setConsolides(body.indicateursConsolides ?? []);
  }, [actionId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setErr(null);
    if (!form.libelle.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/actions/${actionId}/indicateurs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libelle: form.libelle.trim(),
        unite: form.unite.trim() || null,
        cible: form.cible === '' ? null : Number(form.cible),
        realise: form.realise === '' ? null : Number(form.realise),
        sens: form.sens,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setErr(b?.error?.message ?? "Échec de l'ajout");
      return;
    }
    setForm(EMPTY);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/indicateurs/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-bold text-ink">Indicateurs de performance</h3>

      {items.length > 0 ? (
        <ul className="mb-3 space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 rounded bg-slate-50 px-2 py-1.5 text-xs">
              <span className="grow font-medium text-ink">{it.libelle}</span>
              <span className="tabular-nums text-slate-500">
                {it.realise ?? '—'} / {it.cible ?? '—'} {it.unite ?? ''}
              </span>
              {canEdit && (
                <button onClick={() => remove(it.id)} className="font-semibold text-statut-rouge hover:underline">Suppr.</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-slate-400">Aucun indicateur propre à ce nœud.</p>
      )}

      {consolides.length > 0 && (
        <div className="mb-3 rounded bg-accent/5 p-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">Consolidé (sous-arbre)</p>
          <ul className="space-y-0.5">
            {consolides.map((c) => (
              <li key={c.libelle} className="flex items-center gap-2 text-xs">
                <span className="grow text-ink">{c.libelle}</span>
                <span className="tabular-nums text-slate-500">{c.realise ?? '—'} / {c.cible ?? '—'} {c.unite ?? ''}</span>
                {c.tauxRealisation != null && (
                  <span className="w-10 text-right font-semibold tabular-nums text-accent">{c.tauxRealisation}%</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canEdit && (
        <div className="space-y-2">
          {err && <p className="text-xs text-statut-rouge">{err}</p>}
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Libellé" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            <input className="input" placeholder="Unité (ex. %, km)" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} />
            <input className="input" type="number" step="any" placeholder="Cible" value={form.cible} onChange={(e) => setForm({ ...form, cible: e.target.value })} />
            <input className="input" type="number" step="any" placeholder="Réalisé" value={form.realise} onChange={(e) => setForm({ ...form, realise: e.target.value })} />
            <select className="input col-span-2" value={form.sens} onChange={(e) => setForm({ ...form, sens: e.target.value as SensIndicateur })}>
              {SENS_INDICATEUR.map((s) => <option key={s} value={s}>{SENS_LABEL[s]}</option>)}
            </select>
          </div>
          <button type="button" onClick={add} disabled={busy} className="btn-ghost w-full text-sm">
            {busy ? 'Ajout…' : '+ Ajouter un indicateur'}
          </button>
        </div>
      )}
    </div>
  );
}
