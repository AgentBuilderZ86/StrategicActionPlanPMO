import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { getCurrentUser } from './permissions';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'IMPORT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE';

export type AuditEntry = {
  action: AuditAction;
  entite: string;
  entiteId?: string | null;
  avant?: unknown;
  apres?: unknown;
  // Identité : fournie explicitement (ex. évènement de connexion) ou déduite de
  // la session courante si absente.
  userId?: string | null;
  userEmail?: string | null;
};

const asJson = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

/**
 * Journalise une action (T0.4). Ne doit JAMAIS faire échouer la mutation
 * métier : toute erreur d'audit est avalée (log console de secours).
 * @param entry description de l'évènement
 * @param req requête HTTP (pour IP / User-Agent) — optionnelle
 */
export async function logAction(entry: AuditEntry, req?: Request): Promise<void> {
  try {
    let { userId, userEmail } = entry;
    if (userId === undefined && userEmail === undefined) {
      const u = await getCurrentUser().catch(() => null);
      userId = u?.id ?? null;
      userEmail = u?.email ?? null;
    }

    const ip = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req?.headers.get('user-agent') ?? null;

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        action: entry.action,
        entite: entry.entite,
        entiteId: entry.entiteId ?? null,
        avant: asJson(entry.avant),
        apres: asJson(entry.apres),
        ip,
        userAgent,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[audit] échec de journalisation', e);
  }
}
