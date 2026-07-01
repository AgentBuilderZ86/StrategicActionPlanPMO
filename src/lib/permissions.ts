import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { droitsEffectifs, type Droit, type Droits, type Role, type TypeUtilisateur } from './constants';

export type CurrentUser = {
  id?: string;
  email?: string | null;
  role: Role;
  perimetrePays: string[] | null;
  typeUtilisateur: TypeUtilisateur;
  droits: Droits;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as {
    id?: string;
    email?: string | null;
    role?: Role;
    perimetrePays?: string | null;
    typeUtilisateur?: TypeUtilisateur;
    droits?: string | null;
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
  const role = u.role ?? 'LECTEUR';
  let droitsFins: Droits | null = null;
  if (u.droits) {
    try {
      droitsFins = JSON.parse(u.droits) as Droits;
    } catch {
      droitsFins = null;
    }
  }
  return {
    id: u.id,
    email: u.email,
    role,
    perimetrePays: perimetre,
    typeUtilisateur: u.typeUtilisateur ?? 'INTERNE',
    droits: droitsEffectifs(role, droitsFins),
  };
}

type Guard = { ok: true } | { ok: false; code: string; message: string; status: number };

const DENY: Guard = { ok: false, code: 'FORBIDDEN', message: 'Action non autorisée', status: 403 };

const UNAUTHENTICATED: Guard = {
  ok: false,
  code: 'UNAUTHENTICATED',
  message: 'Authentification requise',
  status: 401,
};

/** Exige le droit de saisie + le périmètre. Les droits fins priment sur le rôle
 *  (T1.6) ; par défaut ils sont dérivés du rôle, donc rétrocompatible. */
export async function requireEdit(scopePaysId?: string | null): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;
  if (!user.droits.saisie) return DENY;
  // Périmètre restreint (contributeur régional ou partenaire externe).
  if (user.perimetrePays && scopePaysId) {
    return user.perimetrePays.includes(scopePaysId) ? { ok: true } : DENY;
  }
  return { ok: true };
}

export async function requireRole(roles: Role[]): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;
  return roles.includes(user.role) ? { ok: true } : DENY;
}

/** Exige un droit fin (lecture/saisie/validation/reporting) — T1.6. */
export async function requireDroit(droit: Droit): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;
  return user.droits[droit] ? { ok: true } : DENY;
}
