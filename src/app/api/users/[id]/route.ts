import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { userUpdateSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const { role, perimetrePays, password, unlock } = userUpdateSchema.parse(await req.json());

    const data: Prisma.UserUpdateInput = {};
    if (role !== undefined) data.role = role;
    if (perimetrePays !== undefined) data.perimetrePays = perimetrePays;
    // Réinitialisation du mot de passe par l'admin (soumise à la politique Zod).
    if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 12);
    // Déverrouillage manuel du compte.
    if (unlock) {
      data.failedAttempts = 0;
      data.lockedUntil = null;
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    // On journalise le type de modification sans exposer le mot de passe.
    await logAction(
      {
        action: 'UPDATE',
        entite: 'User',
        entiteId: user.id,
        apres: { ...user, motDePasseModifie: password !== undefined, deverrouille: unlock === true },
      },
      req,
    );
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}
