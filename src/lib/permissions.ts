import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import type { Role } from './constants';

export type CurrentUser = {
  id?: string;
  email?: string | null;
  role: Role;
  perimetrePays: string[] | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as {
    id?: string;
    email?: string | null;
    role?: Role;
    perimetrePays?: string | null;
  };
  let perimetre: string[] | null = null;
  if (u.perimetrePays) {
    try {
      const parsed = JSON.parse(u.perimetrePays);
      if (Array.isArray(parsed)) perimetre = parsed as string[];
    } catch {
      perimetre = null;
    }
  }
  return { id: u.id, email: u.email, role: u.role ?? 'LECTEUR', perimetrePays: perimetre };
}

type Guard = { ok: true } | { ok: false; code: string; message: string; status: number };

const DENY: Guard = { ok: false, code: 'FORBIDDEN', message: 'Action non autorisée', status: 403 };

const UNAUTHENTICATED: Guard = {
  ok: false,
  code: 'UNAUTHENTICATED',
  message: 'Authentification requise',
  status: 401,
};

/** Le lecteur n'a pas le droit d'écrire ; les autres rôles oui. Une session
 *  valide est toujours exigée, en développement comme en production. */
export async function requireEdit(scopePaysId?: string): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;
  if (user.role === 'LECTEUR') return DENY;
  if (user.role === 'CONTRIBUTEUR' && user.perimetrePays && scopePaysId) {
    return user.perimetrePays.includes(scopePaysId) ? { ok: true } : DENY;
  }
  return { ok: true };
}

export async function requireRole(roles: Role[]): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;
  return roles.includes(user.role) ? { ok: true } : DENY;
}
