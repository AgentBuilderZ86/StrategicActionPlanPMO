import { prisma } from './prisma';
import type { Role } from './constants';

export type NotifPayload = {
  type: string;
  titre: string;
  message?: string | null;
  lien?: string | null;
};

/** Crée une notification pour chaque utilisateur ciblé. Ne bloque jamais l'appelant. */
export async function notifierUtilisateurs(userIds: string[], payload: NotifPayload): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: payload.type,
        titre: payload.titre,
        message: payload.message ?? null,
        lien: payload.lien ?? null,
      })),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[notifications] échec createMany', e);
  }
}

/** Notifie tous les utilisateurs ayant l'un des rôles donnés. */
export async function notifierRoles(roles: Role[], payload: NotifPayload): Promise<void> {
  try {
    const users = await prisma.user.findMany({ where: { role: { in: roles } }, select: { id: true } });
    await notifierUtilisateurs(users.map((u) => u.id), payload);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[notifications] échec notifierRoles', e);
  }
}

/**
 * Génère des rappels d'échéance (exig. 18) pour les actions non terminées dont
 * l'échéance est dépassée ou dans les 7 jours. Destinés aux ADMIN/PMO, dédupliqués
 * contre les rappels non lus déjà émis pour la même action. Renvoie le nombre créé.
 * Idempotent : peut être appelé au chargement du tableau de bord ou par un cron.
 */
export async function genererRappelsEcheance(): Promise<number> {
  const dans7j = new Date();
  dans7j.setDate(dans7j.getDate() + 7);

  const actions = await prisma.action.findMany({
    where: { statut: { not: 'TERMINE' }, dateFin: { not: null, lte: dans7j } },
    select: { id: true, titre: true, dateFin: true },
  });
  if (actions.length === 0) return 0;

  const destinataires = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'PMO'] } },
    select: { id: true },
  });
  if (destinataires.length === 0) return 0;

  const maintenant = Date.now();
  let crees = 0;
  for (const a of actions) {
    const enRetard = a.dateFin ? a.dateFin.getTime() < maintenant : false;
    const lien = `/actions?focus=${a.id}`;
    const echeance = a.dateFin ? a.dateFin.toISOString().slice(0, 10) : '';
    for (const u of destinataires) {
      const existe = await prisma.notification.findFirst({
        where: { userId: u.id, type: 'ECHEANCE', lien, lu: false },
        select: { id: true },
      });
      if (existe) continue;
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: 'ECHEANCE',
          titre: `${enRetard ? 'En retard' : 'Échéance proche'} : ${a.titre}`,
          message: `Échéance le ${echeance}`,
          lien,
        },
      });
      crees++;
    }
  }
  return crees;
}
