'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS, type PmoType } from '@/lib/constants';
import { NavIcon, type NavIconId } from './NavIcon';

type ActionResult = { id: string; titre: string; code: string | null };

/**
 * Palette de commandes (Ctrl/Cmd+K) : navigation rapide vers les pages et
 * recherche d'actions du plan actif, sans quitter la page en cours. Les pages
 * proposées respectent la même navigation adaptative que la barre latérale
 * (ex. pas de « Comité de pilotage » suggéré pour un plan SI).
 */
export function CommandPalette({ planId, typePmo }: { planId: string | null; typePmo?: PmoType | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ActionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !planId || query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      const p = new URLSearchParams({ planId, q: query.trim(), pageSize: '8', sort: 'updatedAt', dir: 'desc' });
      fetch(`/api/actions?${p.toString()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => setResults(body?.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [open, planId, query]);

  const termeNormalise = query.trim().toLowerCase();
  const pagesDuPlan = typePmo ? NAV_ITEMS.filter((t) => (t.modules as readonly string[]).includes(typePmo)) : NAV_ITEMS;
  const pagesFiltrees = pagesDuPlan.filter((t) => termeNormalise === '' || t.label.toLowerCase().includes(termeNormalise));

  const allerA = (href: string) => { setOpen(false); router.push(href); };
  const ouvrirAction = (id: string) => { setOpen(false); router.push(`/actions?focus=${id}`); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-canvas px-3 py-[7px] text-xs font-medium text-muted transition-colors hover:border-brand"
        style={{ borderColor: 'var(--border)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="hidden rounded border bg-white px-1 text-[10px] sm:inline" style={{ borderColor: 'var(--border)' }}>
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Palette de commandes"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une action, une page… (Échap pour fermer)"
              className="w-full border-b border-slate-100 px-4 py-3 text-sm outline-none"
            />
            <div className="max-h-80 overflow-y-auto p-1.5">
              {pagesFiltrees.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pages</p>
                  {pagesFiltrees.map((t) => (
                    <button
                      key={t.href}
                      onClick={() => allerA(t.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                    >
                      <NavIcon id={t.icon as NavIconId} size={15} className="shrink-0 text-muted" /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              {query.trim().length >= 2 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Actions {loading ? '· recherche…' : ''}
                  </p>
                  {results.length === 0 && !loading && (
                    <p className="px-2.5 py-2 text-xs text-slate-400">Aucune action trouvée.</p>
                  )}
                  {results.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => ouvrirAction(a.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {a.code && <span className="shrink-0 font-mono text-xs text-accent">{a.code}</span>}
                      <span className="truncate text-ink">{a.titre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
