'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PmoType } from '@/lib/constants';
import { Breadcrumb } from './Breadcrumb';
import { CommandPalette } from './CommandPalette';

/**
 * Coquille applicative (maquette) : barre latérale 242 px persistante
 * (repliable sur mobile) + barre supérieure 66 px (titre de page, chip du
 * plan, recherche, notifications, profil) + contenu avec halo décoratif.
 */
export function AppShell({
  sidebar,
  notificationBell,
  userMenu,
  planId,
  planNom,
  typePmo,
  children,
}: {
  sidebar: React.ReactNode;
  notificationBell: React.ReactNode;
  userMenu: React.ReactNode;
  planId: string | null;
  planNom?: string | null;
  typePmo?: PmoType | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      {mobileOpen && (
        <button
          aria-label="Fermer le menu"
          className="no-print fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 w-[242px] shrink-0 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="no-print flex h-[66px] min-h-[66px] items-center gap-3 border-b bg-white px-4 sm:px-7"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            className="rounded-lg p-1.5 text-lg text-muted hover:bg-canvas md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <span aria-hidden>☰</span>
          </button>
          <Breadcrumb />
          <div className="ml-auto flex shrink-0 items-center gap-3.5">
            {planNom && (
              <div
                className="hidden max-w-[300px] truncate rounded-lg border bg-canvas px-3.5 py-[7px] text-[12.5px] text-muted xl:block"
                style={{ borderColor: 'var(--border)' }}
                title={planNom}
              >
                {planNom}
              </div>
            )}
            <CommandPalette planId={planId} typePmo={typePmo} />
            {notificationBell}
            <div className="h-[26px] w-px" style={{ background: 'var(--border)' }} />
            {userMenu}
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-7">
          {/* Halo décoratif (maquette) */}
          <div
            className="pointer-events-none absolute -right-40 -top-32 z-0 h-[420px] w-[520px]"
            style={{ background: 'radial-gradient(circle, oklch(88% 0.05 155 / 0.35), transparent 70%)' }}
            aria-hidden
          />
          <div className="relative z-[1] animate-fade-in-up">{children}</div>
        </main>

        <footer className="no-print mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 text-center text-xs text-muted sm:px-7">
          NARSA · Agence Nationale de la Sécurité Routière · Pilotage SNSR 2026-2030 · Montants en k MAD
        </footer>
      </div>
    </div>
  );
}
