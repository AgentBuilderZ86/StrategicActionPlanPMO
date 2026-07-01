'use client';

import { useCallback, useEffect, useState } from 'react';
import { fmtDate } from '@/lib/utils';

type Commentaire = {
  id: string;
  auteurNom: string | null;
  contenu: string;
  createdAt: string;
};

/** Fil de commentaires collaboratif d'un nœud (T1.3, exig. 32). */
export function CommentairesPanel({ actionId }: { actionId: string }) {
  const [items, setItems] = useState<Commentaire[]>([]);
  const [contenu, setContenu] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/actions/${actionId}/commentaires`, { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
  }, [actionId]);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!contenu.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/actions/${actionId}/commentaires`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: contenu.trim() }),
    });
    setBusy(false);
    if (res.ok) { setContenu(''); load(); }
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-bold text-ink">Commentaires</h3>

      {items.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {items.map((c) => (
            <li key={c.id} className="rounded bg-slate-50 px-2.5 py-2 text-xs">
              <div className="mb-0.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500">{c.auteurNom ?? 'Anonyme'}</span>
                <span>{fmtDate(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-ink">{c.contenu}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-slate-400">Aucun commentaire pour le moment.</p>
      )}

      <div className="flex gap-2">
        <textarea
          className="input grow"
          rows={2}
          placeholder="Ajouter un commentaire…"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />
        <button type="button" onClick={post} disabled={busy || !contenu.trim()} className="btn-primary self-end">
          {busy ? '…' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
