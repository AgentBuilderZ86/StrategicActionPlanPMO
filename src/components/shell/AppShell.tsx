'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PmoType } from '@/lib/constants';
import { Breadcrumb } from './Breadcrumb';
import { CommandPalette } from './CommandPalette';

/**
 * Coquille applicative (P4) : barre latérale persistante (repliable sur
 * mobile) + barre supérieure (fil d'Ariane, recherche, notifications, profil)
 * + contenu. Remplace l'ancien en-tête horizontal unique.
 */
export function AppShell({
  sidebar,
  notificationBell,
  userMenu,
  planId,
  typePmo,
  children,
}: {
  sidebar: React.ReactNode;
  notificationBell: React.ReactNode;
  userMenu: React.ReactNode;
  planId: string | null;
  typePmo?: PmoType | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {mobileOpen && (
        <button
          aria-label="Fermer le menu"
          className="no-print fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0',
          typePmo === 'SI' ? 'sidebar-fond-dsi' : 'sidebar-fond',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Bandeau dégradé de marque derrière la topbar et le haut de page (V3) */}
        <div aria-hidden className={cn('no-print absolute inset-x-0 top-0 z-0 h-[240px]', typePmo === 'SI' ? 'bandeau-dsi' : 'bandeau-marque')} />
        <header className="no-print relative z-10 flex items-center gap-3 px-4 py-3 text-white sm:px-6">
          <button
            className="rounded-lg p-1.5 text-lg text-white/80 hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <span aria-hidden>☰</span>
          </button>
          <Breadcrumb />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <CommandPalette planId={planId} typePmo={typePmo} />
            {notificationBell}
            {userMenu}
          </div>
        </header>

        <main className="page-enter relative z-[1] mx-auto flex w-full max-w-[1320px] min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-2 sm:px-6">{children}</main>

        <footer className="no-print mx-auto w-full max-w-[1320px] px-4 pb-2 pt-1 text-center text-[10.5px] text-slate-400 sm:px-6">
          NARSA · Agence Nationale de la Sécurité Routière · Pilotage SNSR 2026-2030 · Montants en k MAD
        </footer>
      </div>
    </div>
  );
}
