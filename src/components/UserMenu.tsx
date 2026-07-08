'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { ROLE_LABEL, type Role } from '@/lib/constants';

function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/);
  const premiere = mots[0]?.[0] ?? '';
  const seconde = mots.length > 1 ? mots[mots.length - 1]![0] ?? '' : mots[0]?.[1] ?? '';
  return (premiere + seconde).toUpperCase();
}

/** Profil utilisateur de la barre supérieure : avatar rond à initiales (maquette). */
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-canvas" />;
  }

  if (!session?.user) {
    return (
      <button onClick={() => signIn()} className="btn-primary">
        Connexion
      </button>
    );
  }

  const role = (session.user as { role?: Role }).role ?? 'LECTEUR';
  const nom = session.user.name ?? session.user.email ?? '';

  return (
    <div className="flex items-center gap-[9px]">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: 'var(--brand)' }}
        aria-hidden
      >
        {initiales(nom)}
      </div>
      <div className="hidden leading-[1.3] sm:block">
        <div className="whitespace-nowrap text-[12.5px] font-semibold text-ink">{nom}</div>
        <div className="whitespace-nowrap text-[11px] text-muted">{ROLE_LABEL[role]}</div>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-statut-rouge hover:text-statut-rouge"
        style={{ borderColor: 'var(--border)' }}
      >
        Déconnexion
      </button>
    </div>
  );
}
