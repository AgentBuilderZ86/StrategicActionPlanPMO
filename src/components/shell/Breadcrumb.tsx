'use client';

import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

/** Titre + sous-titre de la page courante dans la barre supérieure (maquette). */
export function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === '/portefeuille') {
    return (
      <div className="min-w-0">
        <div className="truncate text-[17px] font-bold text-ink">Portefeuille de plans</div>
        <div className="mt-px truncate text-xs text-muted">Tous les plans pilotés par la NARSA</div>
      </div>
    );
  }

  const current = NAV_ITEMS.find((t) => (t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)));

  return (
    <div className="min-w-0">
      <div className="truncate text-[17px] font-bold text-ink">{current?.label ?? 'PMO NARSA'}</div>
      <div className="mt-px truncate text-xs text-muted">{current?.sub ?? 'Plateforme de pilotage'}</div>
    </div>
  );
}
