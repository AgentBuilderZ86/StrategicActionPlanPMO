'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { ROLE_LABEL, type Role } from '@/lib/constants';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />;
  }

  if (!session?.user) {
    return (
      <button onClick={() => signIn()} className="btn-primary">
        Connexion
      </button>
    );
  }

  const role = (session.user as { role?: Role }).role ?? 'LECTEUR';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-semibold leading-tight text-white">{session.user.name ?? session.user.email}</div>
        <div className="text-[11px] text-accent-soft">{ROLE_LABEL[role]}</div>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
      >
        Déconnexion
      </button>
    </div>
  );
}
