'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionCard } from '@/components/ui/Cards';
import { fmtDate } from '@/lib/utils';

type Token = {
  id: string;
  nom: string;
  prefix: string;
  scopes: string;
  dernierAcces: string | null;
  revoque: boolean;
  createdAt: string;
};

/** Gestion des jetons d'API d'interopérabilité (T2.4, exig. 36). */
export function TokensAdmin() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [nom, setNom] = useState('');
  const [scopes, setScopes] = useState<'read' | 'read_write'>('read');
  const [nouveau, setNouveau] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/tokens', { cache: 'no-store' });
    if (res.ok) setTokens(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const creer = async () => {
    if (!nom.trim()) return;
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nom.trim(), scopes }),
    });
    if (res.ok) {
      const body = await res.json();
      setNouveau(body.token);
      setNom('');
      load();
    }
  };

  const revoquer = async (id: string) => {
    if (!window.confirm('Révoquer ce jeton ? Les systèmes qui l’utilisent perdront l’accès.')) return;
    await fetch(`/api/admin/tokens/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <SectionCard title="Interopérabilité — Jetons d'API" subtitle="Accès des systèmes tiers à l'API v1 (ERP/GED). Documentation OpenAPI : /api/v1/openapi.json">
      {nouveau && (
        <div className="mb-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-xs">
          <p className="mb-1 font-semibold text-ink">Nouveau jeton (copiez-le, il ne sera plus affiché) :</p>
          <code className="block break-all rounded bg-white px-2 py-1 font-mono text-accent">{nouveau}</code>
          <button onClick={() => setNouveau(null)} className="mt-2 text-slate-400 hover:underline">Masquer</button>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="mb-3 space-y-1">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="font-semibold text-ink">{t.nom}</span>
              <span className="font-mono text-slate-400">{t.prefix}…</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{t.scopes}</span>
              {t.revoque && <span className="text-statut-rouge">révoqué</span>}
              <span className="ml-auto text-[10px] text-slate-400">
                {t.dernierAcces ? `dernier accès ${fmtDate(t.dernierAcces)}` : 'jamais utilisé'}
              </span>
              {!t.revoque && <button onClick={() => revoquer(t.id)} className="font-semibold text-statut-rouge hover:underline">Révoquer</button>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <input className="input grow" placeholder="Nom du jeton (ex. ERP finances)…" value={nom} onChange={(e) => setNom(e.target.value)} />
        <select className="input w-auto" value={scopes} onChange={(e) => setScopes(e.target.value as 'read' | 'read_write')}>
          <option value="read">Lecture seule</option>
          <option value="read_write">Lecture / écriture</option>
        </select>
        <button onClick={creer} className="btn-ghost">Générer</button>
      </div>
    </SectionCard>
  );
}
