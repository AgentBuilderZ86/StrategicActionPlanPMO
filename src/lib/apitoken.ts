import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

/** Génère un jeton d'API en clair (préfixe lisible + secret aléatoire). */
export function genererToken(): { token: string; prefix: string } {
  const secret = randomBytes(24).toString('hex');
  const token = `narsa_${secret}`;
  return { token, prefix: token.slice(0, 12) };
}

/** Empreinte SHA-256 d'un jeton (jamais stocké en clair). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Authentifie une requête via l'en-tête `Authorization: Bearer <token>`.
 * Renvoie l'enregistrement du jeton (non révoqué) ou null. Met à jour la date
 * de dernier accès de façon best-effort.
 */
export async function authentifierToken(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1]!.trim();
  const tokenHash = hashToken(token);
  const enreg = await prisma.apiToken.findUnique({ where: { tokenHash } });
  if (!enreg || enreg.revoque) return null;
  prisma.apiToken.update({ where: { id: enreg.id }, data: { dernierAcces: new Date() } }).catch(() => {});
  return enreg;
}
