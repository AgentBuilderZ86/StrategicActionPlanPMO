'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fmtDate } from '@/lib/utils';

type Notif = {
  id: string;
  type: string;
  titre: string;
  message: string | null;
  lien: string | null;
  lu: boolean;
  createdAt: string;
};

/** Cloche de notifications in-app (T1.4). */
export function NotificationBell() {
  const { status } = useSession();
  const [items, setItems] = useState<Notif[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) return;
    const body = await res.json();
    setItems(body.data ?? []);
    setNonLues(body.nonLues ?? 0);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [status, load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const marquerToutLu = async () => {
    await fetch('/api/notifications', { method: 'POST' });
    load();
  };

  if (status !== 'authenticated') return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <span aria-hidden className="text-lg">🔔</span>
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-statut-rouge px-1 text-[10px] font-bold text-white">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white text-ink shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-bold">Notifications</span>
            {nonLues > 0 && (
              <button onClick={marquerToutLu} className="text-xs font-semibold text-accent hover:underline">Tout marquer lu</button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-8 text-center text-xs text-slate-400">Aucune notification.</li>
            )}
            {items.map((n) => {
              const contenu = (
                <>
                  <div className="flex items-start gap-2">
                    {!n.lu && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
                    <div className="min-w-0">
                      <p className={`truncate text-xs font-semibold ${n.lu ? 'text-slate-500' : 'text-ink'}`}>{n.titre}</p>
                      {n.message && <p className="truncate text-[11px] text-slate-400">{n.message}</p>}
                      <p className="text-[10px] text-slate-300">{fmtDate(n.createdAt)}</p>
                    </div>
                  </div>
                </>
              );
              return (
                <li key={n.id} className="border-t border-slate-50 first:border-t-0">
                  {n.lien ? (
                    <a href={n.lien} className="block px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>{contenu}</a>
                  ) : (
                    <div className="px-3 py-2">{contenu}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
