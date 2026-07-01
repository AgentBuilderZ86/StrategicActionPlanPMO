import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { Role } from './constants';

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 heures

// Verrouillage de compte (T0.3, exig. 37)
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Journalisation des connexions (T0.4, exig. 33). Écriture directe via prisma
// pour éviter un cycle d'import avec src/lib/audit.ts → permissions → auth.
async function journaliserConnexion(
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE',
  email: string,
  userId: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: { action, entite: 'Auth', userEmail: email, userId },
    });
  } catch {
    // l'audit ne doit jamais bloquer l'authentification
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  jwt: { maxAge: SESSION_MAX_AGE },
  pages: { signIn: '/connexion' },
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.passwordHash) return null;

        // Compte verrouillé après trop d'échecs (T0.3, exig. 37).
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          await journaliserConnexion('LOGIN_FAILURE', credentials.email, user.id);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          const failedAttempts = user.failedAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts,
              lockedUntil:
                failedAttempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCK_DURATION_MS)
                  : null,
            },
          });
          await journaliserConnexion('LOGIN_FAILURE', credentials.email, user.id);
          return null;
        }

        // Succès : on réinitialise le compteur d'échecs.
        if (user.failedAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }
        await journaliserConnexion('LOGIN_SUCCESS', credentials.email, user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          perimetrePays: user.perimetrePays,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? 'LECTEUR';
        token.perimetrePays = (user as { perimetrePays?: string | null }).perimetrePays ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { role?: Role }).role = (token.role as Role) ?? 'LECTEUR';
        (session.user as { perimetrePays?: string | null }).perimetrePays =
          (token.perimetrePays as string | null) ?? null;
      }
      return session;
    },
  },
};
