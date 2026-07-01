'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionCard } from '@/components/ui/Cards';

type Demande = {
  id: string;
  roleValidateur: string;
  demandeurNom: string | null;
  commentaire: string | null;
  createdAt: string;
  action: { id: string; titre: string; code: string | null; niveau: number };
};

/** File d'attente de validation pour ADMIN/PMO (T1.5, exig. 24, 25). */
export function ValidationQueue() {
  const [items, setItems] = useState<Demande[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/validations?statut=EN_ATTENTE', { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const decider = async (id: string, decision: 'APPROUVE' | 'REJETE') => {
    setBusy(id);
    await fetch(`/api/validations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    setBusy(null);
    load();
  };

  return (
    <SectionCard title="Validations en attente" subtitle="Demandes de validation hiérarchique à traiter.">
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune demande en attente.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold text-ink">
                  {d.action.code && <span className="mr-1.5 font-mono text-xs text-accent">{d.action.code}</span>}
                  {d.action.titre}
                </div>
                <div className="text-xs text-slate-400">
                  Demandé par {d.demandeurNom ?? '—'} · validateur {d.roleValidateur}
                  {d.commentaire ? ` · « ${d.commentaire} »` : ''}
                </div>
              </div>
              <button onClick={() => decider(d.id, 'APPROUVE')} disabled={busy === d.id} className="rounded-lg bg-statut-vert/10 px-3 py-1.5 text-xs font-semibold text-statut-vert hover:bg-statut-vert/20">Approuver</button>
              <button onClick={() => decider(d.id, 'REJETE')} disabled={busy === d.id} className="rounded-lg bg-statut-rouge/10 px-3 py-1.5 text-xs font-semibold text-statut-rouge hover:bg-statut-rouge/20">Rejeter</button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
