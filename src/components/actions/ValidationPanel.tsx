'use client';

import { useCallback, useEffect, useState } from 'react';
import { VALIDATION_LABEL, type ValidationStatut } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';

type Demande = {
  id: string;
  statut: string;
  roleValidateur: string;
  demandeurNom: string | null;
  validateurNom: string | null;
  commentaire: string | null;
  decideeAt: string | null;
  createdAt: string;
};

const COULEUR: Record<string, string> = {
  EN_ATTENTE: 'text-statut-ambre',
  APPROUVE: 'text-statut-vert',
  REJETE: 'text-statut-rouge',
};

/** Soumission et suivi de la validation hiérarchique d'un nœud (T1.5). */
export function ValidationPanel({ actionId, canEdit }: { actionId: string; canEdit: boolean }) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/actions/${actionId}/validation`, { cache: 'no-store' });
    if (res.ok) setDemandes(await res.json());
  }, [actionId]);

  useEffect(() => { load(); }, [load]);

  const enAttente = demandes.some((d) => d.statut === 'EN_ATTENTE');

  const soumettre = async () => {
    setErr(null);
    setBusy(true);
    const res = await fetch(`/api/actions/${actionId}/validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setErr(b?.error?.message ?? 'Échec de la soumission');
      return;
    }
    load();
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Validation</h3>
        {canEdit && !enAttente && (
          <button type="button" onClick={soumettre} disabled={busy} className="btn-ghost text-xs">
            {busy ? '…' : 'Soumettre pour validation'}
          </button>
        )}
      </div>
      {err && <p className="mb-2 text-xs text-statut-rouge">{err}</p>}

      {demandes.length === 0 ? (
        <p className="text-xs text-slate-400">Aucune demande de validation.</p>
      ) : (
        <ul className="space-y-1.5">
          {demandes.map((d) => (
            <li key={d.id} className="rounded bg-slate-50 px-2.5 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${COULEUR[d.statut] ?? 'text-ink'}`}>
                  {VALIDATION_LABEL[d.statut as ValidationStatut] ?? d.statut}
                  <span className="ml-1 font-normal text-slate-400">· validateur {d.roleValidateur}</span>
                </span>
                <span className="text-[10px] text-slate-400">{fmtDate(d.decideeAt ?? d.createdAt)}</span>
              </div>
              {d.validateurNom && <p className="text-[11px] text-slate-500">Par {d.validateurNom}</p>}
              {d.commentaire && <p className="text-[11px] text-slate-400">{d.commentaire}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
