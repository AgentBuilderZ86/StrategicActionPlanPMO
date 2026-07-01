'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionCard } from '@/components/ui/Cards';
import { ATTRIBUT_TYPES, ATTRIBUT_TYPE_LABEL, NIVEAU_MAX, niveauLabel, type AttributType } from '@/lib/constants';

type AttributDef = {
  id: string;
  niveau: number | null;
  cle: string;
  libelle: string;
  type: string;
  options: string | null;
  obligatoire: boolean;
};

const EMPTY = { cle: '', libelle: '', type: 'TEXTE' as AttributType, niveau: '', options: '', obligatoire: false };

/** Administration des attributs métier personnalisables (T1.1, exig. 9, 10). */
export function AttributsAdmin({ planId, canManage }: { planId: string; canManage: boolean }) {
  const [defs, setDefs] = useState<AttributDef[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/attributs?planId=${planId}`, { cache: 'no-store' });
    if (res.ok) setDefs(await res.json());
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setErr(null);
    if (!form.cle.trim() || !form.libelle.trim()) return;
    const res = await fetch('/api/attributs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        cle: form.cle.trim(),
        libelle: form.libelle.trim(),
        type: form.type,
        niveau: form.niveau === '' ? null : Number(form.niveau),
        options: form.type === 'LISTE' ? form.options.trim() || null : null,
        obligatoire: form.obligatoire,
      }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setErr(b?.error?.message ?? "Échec de l'ajout");
      return;
    }
    setForm(EMPTY);
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer cet attribut et toutes ses valeurs ?')) return;
    await fetch(`/api/attributs/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <SectionCard title="Attributs métier personnalisés" subtitle="Champs additionnels appliqués aux actions selon leur niveau.">
      {defs.length > 0 && (
        <ul className="mb-3 space-y-1">
          {defs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-ink">{d.libelle}</span>
              <span className="text-xs text-slate-400">
                {ATTRIBUT_TYPE_LABEL[d.type as AttributType] ?? d.type}
                {d.niveau ? ` · ${niveauLabel(d.niveau)}` : ' · tous niveaux'}
                {d.obligatoire ? ' · obligatoire' : ''}
              </span>
              {canManage && <button onClick={() => remove(d.id)} className="ml-auto text-xs font-semibold text-statut-rouge">Suppr.</button>}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="space-y-2">
          {err && <p className="text-xs text-statut-rouge">{err}</p>}
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Clé (a-z, 0-9, _)" value={form.cle} onChange={(e) => setForm({ ...form, cle: e.target.value })} />
            <input className="input" placeholder="Libellé" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AttributType })}>
              {ATTRIBUT_TYPES.map((t) => <option key={t} value={t}>{ATTRIBUT_TYPE_LABEL[t]}</option>)}
            </select>
            <select className="input" value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })}>
              <option value="">Tous les niveaux</option>
              {Array.from({ length: NIVEAU_MAX }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{niveauLabel(n)}</option>
              ))}
            </select>
            {form.type === 'LISTE' && (
              <input className="input col-span-2" placeholder="Options séparées par des « ; »" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            )}
            <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.obligatoire} onChange={(e) => setForm({ ...form, obligatoire: e.target.checked })} />
              Obligatoire
            </label>
          </div>
          <button type="button" onClick={add} className="btn-ghost w-full text-sm">+ Ajouter un attribut</button>
        </div>
      )}
    </SectionCard>
  );
}
