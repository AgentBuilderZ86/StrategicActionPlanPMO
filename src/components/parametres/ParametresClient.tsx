'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ROLES, ROLE_LABEL, DROITS, DROIT_LABEL, TYPES_UTILISATEUR, TYPE_UTILISATEUR_LABEL,
  droitsEffectifs, type Role, type Droits, type Droit,
} from '@/lib/constants';
import { SectionCard } from '@/components/ui/Cards';
import { AuditJournal } from './AuditJournal';
import { AttributsAdmin } from './AttributsAdmin';
import { ValidationQueue } from './ValidationQueue';

type Axe = { id: string; nom: string; ordre: number };
type Pays = { id: string; nom: string; code: string | null };
type Entite = { id: string; nom: string; paysId: string | null };
type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  typeUtilisateur?: string;
  droits?: string | null;
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => null);
    throw new Error(b?.error?.message ?? 'Erreur');
  }
  return res.json();
}

export function ParametresClient({ planId, planNom }: { planId: string; planNom: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const isAdmin = role === 'ADMIN';
  const canManage = role === 'ADMIN' || role === 'PMO';

  const [nom, setNom] = useState(planNom);
  const [axes, setAxes] = useState<Axe[]>([]);
  const [pays, setPays] = useState<Pays[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [a, p, e] = await Promise.all([
      fetch(`/api/axes?planId=${planId}`).then((r) => r.json()),
      fetch(`/api/pays?planId=${planId}`).then((r) => r.json()),
      fetch(`/api/entites?planId=${planId}`).then((r) => r.json()),
    ]);
    setAxes(a);
    setPays(p);
    setEntites(e);
    if (isAdmin) {
      const u = await fetch('/api/users').then((r) => (r.ok ? r.json() : []));
      setUsers(u);
    }
  }, [planId, isAdmin]);

  useEffect(() => {
    reload();
  }, [reload]);

  const wrap = (fn: () => Promise<void>) => async () => {
    setErr(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  };

  // — Plan
  const renamePlan = wrap(async () => {
    await api(`/api/plans/${planId}`, 'PATCH', { nom });
    router.refresh();
  });

  // — Axes (ordonnables)
  const [newAxe, setNewAxe] = useState('');
  const addAxe = wrap(async () => {
    if (!newAxe.trim()) return;
    await api('/api/axes', 'POST', { nom: newAxe.trim(), ordre: axes.length, planId });
    setNewAxe('');
  });
  const moveAxe = (axe: Axe, dir: -1 | 1) =>
    wrap(async () => {
      const sorted = [...axes].sort((x, y) => x.ordre - y.ordre);
      const idx = sorted.findIndex((x) => x.id === axe.id);
      const swap = sorted[idx + dir];
      if (!swap) return;
      await api(`/api/axes/${axe.id}`, 'PATCH', { ordre: swap.ordre });
      await api(`/api/axes/${swap.id}`, 'PATCH', { ordre: axe.ordre });
    })();

  return (
    <div className="space-y-5">
      {err && <div className="card border-statut-rouge/40 bg-statut-rouge/5 p-3 text-sm text-statut-rouge">{err}</div>}

      <SectionCard title="Plan" subtitle="Identité du plan d'action stratégique.">
        <div className="flex flex-wrap gap-2">
          <input className="input grow" value={nom} onChange={(e) => setNom(e.target.value)} disabled={!canManage} aria-label="Nom du plan" />
          {canManage && <button onClick={renamePlan} className="btn-primary">Renommer</button>}
        </div>
      </SectionCard>

      <SectionCard title="Axes stratégiques" subtitle="Ordonnés ; utilisés pour classer les actions.">
        <ul className="mb-3 space-y-1">
          {[...axes].sort((a, b) => a.ordre - b.ordre).map((axe, i, arr) => (
            <li key={axe.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="grow text-sm font-medium text-ink">{axe.nom}</span>
              {canManage && (
                <>
                  <button onClick={() => moveAxe(axe, -1)} disabled={i === 0} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Monter">▲</button>
                  <button onClick={() => moveAxe(axe, 1)} disabled={i === arr.length - 1} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Descendre">▼</button>
                  <button onClick={wrap(async () => { await api(`/api/axes/${axe.id}`, 'DELETE'); })} className="text-xs font-semibold text-statut-rouge">Suppr.</button>
                </>
              )}
            </li>
          ))}
        </ul>
        {canManage && (
          <div className="flex gap-2">
            <input className="input grow" placeholder="Nouvel axe…" value={newAxe} onChange={(e) => setNewAxe(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAxe()} />
            <button onClick={addAxe} className="btn-ghost">Ajouter</button>
          </div>
        )}
      </SectionCard>

      <RefSimple
        title="Régions"
        items={pays.map((p) => ({ id: p.id, label: p.nom }))}
        canManage={canManage}
        onAdd={async (nomVal) => { await api('/api/pays', 'POST', { nom: nomVal, planId }); }}
        onDelete={async (id) => { await api(`/api/pays/${id}`, 'DELETE'); }}
        wrap={wrap}
      />

      <SectionCard title="Pôles / Partenaires" subtitle="Rattachés à une région.">
        <ul className="mb-3 space-y-1">
          {entites.map((ent) => (
            <li key={ent.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="grow text-sm font-medium text-ink">{ent.nom}</span>
              <span className="text-xs text-slate-400">{pays.find((p) => p.id === ent.paysId)?.nom ?? '—'}</span>
              {canManage && (
                <button onClick={wrap(async () => { await api(`/api/entites/${ent.id}`, 'DELETE'); })} className="text-xs font-semibold text-statut-rouge">Suppr.</button>
              )}
            </li>
          ))}
        </ul>
        {canManage && <EntiteAdder pays={pays} onAdd={async (nomVal, paysId2) => { await api('/api/entites', 'POST', { nom: nomVal, paysId: paysId2, planId }); }} wrap={wrap} />}
      </SectionCard>

      {isAdmin && (
        <SectionCard title="Utilisateurs, rôles & habilitations" subtitle="Réservé aux administrateurs.">
          <ul className="space-y-2">
            {users.map((u) => (
              <UserRowEditor key={u.id} user={u} onPatch={(body) => wrap(async () => { await api(`/api/users/${u.id}`, 'PATCH', body); })()} />
            ))}
          </ul>
        </SectionCard>
      )}

      {canManage && <ValidationQueue />}

      <AttributsAdmin planId={planId} canManage={canManage} />

      {isAdmin && <AuditJournal />}

      {canManage && (
        <SectionCard title="Données de démonstration" subtitle="Réinitialiser le jeu de données (désactivé en production).">
          <button
            onClick={wrap(async () => {
              if (!window.confirm('Réinitialiser toutes les données de démonstration ?')) return;
              await api('/api/dev/reset', 'POST');
              router.refresh();
            })}
            className="rounded-lg border border-statut-rouge px-4 py-2 text-sm font-semibold text-statut-rouge hover:bg-statut-rouge/5"
          >
            Réinitialiser les données démo
          </button>
        </SectionCard>
      )}
    </div>
  );
}

function UserRowEditor({
  user,
  onPatch,
}: {
  user: UserRow;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const initialDroits: Droits = (() => {
    if (user.droits) {
      try { return JSON.parse(user.droits) as Droits; } catch { /* ignore */ }
    }
    return droitsEffectifs(user.role as Role, null);
  })();
  const [droits, setDroits] = useState<Droits>(initialDroits);

  const toggle = (d: Droit) => {
    const next = { ...droits, [d]: !droits[d] };
    setDroits(next);
    onPatch({ droits: next });
  };

  return (
    <li className="rounded-lg bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 grow">
          <div className="truncate text-sm font-semibold text-ink">{user.name ?? '—'}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
        </div>
        <select
          className="input w-auto"
          value={user.role}
          onChange={(e) => onPatch({ role: e.target.value })}
          aria-label="Rôle"
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <select
          className="input w-auto"
          value={user.typeUtilisateur ?? 'INTERNE'}
          onChange={(e) => onPatch({ typeUtilisateur: e.target.value })}
          aria-label="Type d'utilisateur"
        >
          {TYPES_UTILISATEUR.map((t) => <option key={t} value={t}>{TYPE_UTILISATEUR_LABEL[t]}</option>)}
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {DROITS.map((d) => (
          <label key={d} className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <input type="checkbox" checked={droits[d]} onChange={() => toggle(d)} />
            {DROIT_LABEL[d]}
          </label>
        ))}
      </div>
    </li>
  );
}

function RefSimple({
  title,
  items,
  canManage,
  onAdd,
  onDelete,
  wrap,
}: {
  title: string;
  items: { id: string; label: string }[];
  canManage: boolean;
  onAdd: (nom: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  wrap: (fn: () => Promise<void>) => () => Promise<void>;
}) {
  const [val, setVal] = useState('');
  return (
    <SectionCard title={title}>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink">
            {it.label}
            {canManage && <button onClick={wrap(() => onDelete(it.id))} className="font-bold text-slate-400" aria-label={`Supprimer ${it.label}`}>✕</button>}
          </span>
        ))}
      </div>
      {canManage && (
        <div className="flex gap-2">
          <input className="input grow" placeholder={`Nouveau…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { wrap(async () => { await onAdd(val.trim()); setVal(''); })(); } }} />
          <button onClick={wrap(async () => { if (val.trim()) { await onAdd(val.trim()); setVal(''); } })} className="btn-ghost">Ajouter</button>
        </div>
      )}
    </SectionCard>
  );
}

function EntiteAdder({
  pays,
  onAdd,
  wrap,
}: {
  pays: { id: string; nom: string }[];
  onAdd: (nom: string, paysId: string) => Promise<void>;
  wrap: (fn: () => Promise<void>) => () => Promise<void>;
}) {
  const [val, setVal] = useState('');
  const [paysId, setPaysId] = useState(pays[0]?.id ?? '');
  useEffect(() => { if (!paysId && pays[0]) setPaysId(pays[0].id); }, [pays, paysId]);
  return (
    <div className="flex flex-wrap gap-2">
      <input className="input grow" placeholder="Nouveau pôle / partenaire…" value={val} onChange={(e) => setVal(e.target.value)} />
      <select className="input w-auto" value={paysId} onChange={(e) => setPaysId(e.target.value)}>
        {pays.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
      <button onClick={wrap(async () => { if (val.trim() && paysId) { await onAdd(val.trim(), paysId); setVal(''); } })} className="btn-ghost">Ajouter</button>
    </div>
  );
}
