'use client';

import { Icone } from '@/components/ui/Icones';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

/** Fil d'Ariane léger : repère la page courante par rapport au portefeuille. */
export function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === '/portefeuille') {
    return <span className="truncate text-sm font-semibold text-ink">🗂️ Portefeuille de plans</span>;
  }

  const current = NAV_ITEMS.find((t) => (t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)));

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link href="/portefeuille" className="shrink-0 text-slate-400 hover:text-ink">Portefeuille</Link>
      <span className="text-slate-300" aria-hidden>/</span>
      <span className="truncate font-semibold text-ink">
        {current ? <span className="inline-flex items-center gap-1.5"><Icone nom={current.icon} className="h-4 w-4" /> {current.label}</span> : 'PMO NARSA'}
      </span>
    </div>
  );
}
