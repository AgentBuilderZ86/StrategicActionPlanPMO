'use client';

import { useCallback, useEffect, useState } from 'react';

type AttributDef = {
  id: string;
  planId: string | null;
  niveau: number | null;
  cle: string;
  libelle: string;
  type: string;
  options: string | null;
  obligatoire: boolean;
  ordre: number;
};

/** Champs métier dynamiques d'une action selon les définitions applicables (T1.1). */
export function AttributsPanel({
  actionId,
  planId,
  niveau,
  canEdit,
}: {
  actionId: string;
  planId: string;
  niveau: number;
  canEdit: boolean;
}) {
  const [defs, setDefs] = useState<AttributDef[]>([]);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [d, v] = await Promise.all([
      fetch(`/api/attributs?planId=${planId}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/actions/${actionId}/attributs`, { cache: 'no-store' }).then((r) => r.json()),
    ]);
    const applicables: AttributDef[] = (d ?? []).filter(
      (x: AttributDef) => x.niveau == null || x.niveau === niveau,
    );
    setDefs(applicables);
    const map: Record<string, string> = {};
    for (const val of v ?? []) map[val.attributDefId] = val.valeur ?? '';
    setValeurs(map);
  }, [actionId, planId, niveau]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const payload = { valeurs: Object.fromEntries(defs.map((d) => [d.id, valeurs[d.id] ?? null])) };
    const res = await fetch(`/api/actions/${actionId}/attributs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  if (defs.length === 0) return null;

  const champ = (d: AttributDef) => {
    const value = valeurs[d.id] ?? '';
    const set = (v: string) => setValeurs((prev) => ({ ...prev, [d.id]: v }));
    switch (d.type) {
      case 'NOMBRE':
        return <input className="input" type="number" step="any" value={value} onChange={(e) => set(e.target.value)} />;
      case 'DATE':
        return <input className="input" type="date" value={value} onChange={(e) => set(e.target.value)} />;
      case 'BOOLEEN':
        return (
          <select className="input" value={value} onChange={(e) => set(e.target.value)}>
            <option value="">—</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        );
      case 'LISTE':
        return (
          <select className="input" value={value} onChange={(e) => set(e.target.value)}>
            <option value="">—</option>
            {(d.options ?? '').split(';').map((o) => o.trim()).filter(Boolean).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        );
      default:
        return <input className="input" value={value} onChange={(e) => set(e.target.value)} />;
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-bold text-ink">Attributs métier</h3>
      <div className="grid grid-cols-2 gap-3">
        {defs.map((d) => (
          <div key={d.id}>
            <label className="label">{d.libelle}{d.obligatoire && ' *'}</label>
            {champ(d)}
          </div>
        ))}
      </div>
      {canEdit && (
        <button type="button" onClick={save} disabled={busy} className="btn-ghost mt-3 w-full text-sm">
          {busy ? 'Enregistrement…' : saved ? '✓ Attributs enregistrés' : 'Enregistrer les attributs'}
        </button>
      )}
    </div>
  );
}
