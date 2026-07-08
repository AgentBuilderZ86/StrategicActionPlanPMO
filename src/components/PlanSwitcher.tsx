'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PMO_TYPE_LABEL, type PmoType } from '@/lib/constants';
import { NavIcon } from '@/components/shell/NavIcon';

type PlanOption = { id: string; nom: string; typePmo: string };

/**
 * Sélecteur global de plan (barre latérale) — choix explicite, persistant
 * (cookie), hérité par toutes les pages. Un seul point de bascule dans l'app.
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

  // Lecture seule (non connecté) : pas de bascule à proposer.
  if (status !== 'authenticated' || plans.length === 0) {
    return (
      <div className="truncate rounded-[10px] bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white/85">
        {titre}
      </div>
    );
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
        className="flex w-full items-center gap-2 rounded-[10px] bg-white/[0.06] px-3 py-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-white/[0.12]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/45">Plan actif</span>
          <span className="block truncate text-xs font-semibold text-white/90">{titre}</span>
        </span>
        <span aria-hidden className="shrink-0 text-[10px] text-white/50">{pending ? '…' : '▾'}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-2 rounded-xl border bg-white p-1.5 text-ink shadow-xl"
          style={{ borderColor: 'var(--border)' }}
          role="listbox"
        >
          {plans.length > 1 && (
            <>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Changer de plan</p>
              <ul>
                {plans.map((p) => (
                  <li key={p.id}>
                    <button
                      role="option"
                      aria-selected={p.id === currentId}
                      onClick={() => selectionner(p.id)}
                      className={`flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-canvas ${
                        p.id === currentId ? 'bg-statut-vert-bg font-semibold text-brand' : 'text-ink'
                      }`}
                    >
                      <span className="truncate">{p.nom}</span>
                      <span className="text-[10px] font-medium text-muted">
                        {PMO_TYPE_LABEL[p.typePmo as PmoType] ?? p.typePmo}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
            </>
          )}
          <Link
            href="/portefeuille"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand hover:bg-statut-vert-bg"
          >
            <NavIcon id="portfolio" size={14} /> Vue portefeuille (tous les plans)
          </Link>
        </div>
      )}
    </div>
  );
}
