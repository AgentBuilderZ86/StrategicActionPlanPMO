'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PMO_TYPE_LABEL, type PmoType } from '@/lib/constants';

type PlanOption = { id: string; nom: string; typePmo: string };

/**
 * Sélecteur global de plan (en-tête) — remplace la coexistence plate des
 * plans par un choix explicite, persistant (cookie), hérité par toutes les
 * pages. Un seul point de bascule dans l'app, au lieu d'un select enterré
 * dans les filtres du tableau de bord.
 */
export function PlanSwitcher({
  plans,
  currentId,
  fallbackTitle,
}: {
  plans: PlanOption[];
  currentId: string | null;
  fallbackTitle: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = plans.find((p) => p.id === currentId);
  const titre = current?.nom ?? fallbackTitle;

  // Lecture seule (non connecté, ou un seul plan) : pas de bascule à proposer.
  if (status !== 'authenticated' || plans.length <= 1) {
    return <h1 className="truncate font-title text-lg font-extrabold leading-tight">{titre}</h1>;
  }

  const selectionner = async (id: string) => {
    setOpen(false);
    if (id === currentId) return;
    await fetch('/api/plan-select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: id }),
    }).catch(() => {});
    startTransition(() => router.refresh());
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="-ml-1 flex items-center gap-1.5 rounded-lg px-1 py-0.5 font-title text-lg font-extrabold leading-tight hover:bg-white/10"
      >
        <span className="max-w-[46vw] truncate sm:max-w-xs">{titre}</span>
        <span aria-hidden className="text-xs opacity-60">{pending ? '…' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-1.5 text-ink shadow-xl" role="listbox">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Changer de plan</p>
          <ul>
            {plans.map((p) => (
              <li key={p.id}>
                <button
                  role="option"
                  aria-selected={p.id === currentId}
                  onClick={() => selectionner(p.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 ${
                    p.id === currentId ? 'bg-accent/5 font-semibold text-accent' : 'text-ink'
                  }`}
                >
                  <span className="truncate">{p.nom}</span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    {(PMO_TYPE_LABEL[p.typePmo as PmoType] ?? p.typePmo).replace(/^PMO /, '')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
