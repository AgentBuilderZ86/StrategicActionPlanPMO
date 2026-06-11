'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { canEditClient, type Role } from '@/lib/constants';

function defaultPeriode() {
  return new Date().toISOString().slice(0, 7); // yyyy-mm
}

export function CopilActions({ planId, initialFaits }: { planId: string; initialFaits: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = canEditClient((session?.user as { role?: Role } | undefined)?.role);

  const [periode, setPeriode] = useState(defaultPeriode());
  const [faits, setFaits] = useState(initialFaits);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const snapshot = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, periode, faitsMarquants: faits }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg('Snapshot enregistré.');
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setMsg(body?.error?.message ?? 'Échec du snapshot');
    }
  };

  return (
    <>
    <div className="no-print card mb-5 flex flex-wrap items-end gap-3 p-3">
      <div>
        <label className="label" htmlFor="periode">Période</label>
        <input id="periode" type="month" className="input w-auto" value={periode} onChange={(e) => setPeriode(e.target.value)} />
      </div>
      <div className="min-w-[260px] grow">
        <label className="label" htmlFor="faits">Faits marquants</label>
        <textarea
          id="faits"
          rows={2}
          className="input"
          placeholder="Faits marquants de la période…"
          value={faits}
          onChange={(e) => setFaits(e.target.value)}
          disabled={!canEdit}
        />
      </div>
      <button onClick={() => window.print()} className="btn-ghost">Imprimer / PDF</button>
      {canEdit && (
        <button onClick={snapshot} disabled={busy} className="btn-primary">
          {busy ? 'Enregistrement…' : 'Snapshot du mois'}
        </button>
      )}
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
      </div>
      {/* Bloc imprimable : faits marquants de la période */}
      {faits.trim() && (
        <div className="card mb-5 hidden p-4 print:block">
          <h3 className="font-title text-sm font-bold text-ink">Faits marquants — {periode}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{faits}</p>
        </div>
      )}
    </>
  );
}
