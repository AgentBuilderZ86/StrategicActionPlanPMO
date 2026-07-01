import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { userCreateSchema } from '@/lib/zod';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, lockedUntil: true,
        typeUtilisateur: true, droits: true,
      },
      orderBy: { email: 'asc' },
    });
    return ok(users);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const { name, email, password, role, perimetrePays } = userCreateSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail('CONFLICT', 'Un utilisateur avec cet e-mail existe déjà', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, perimetrePays: perimetrePays ?? null },
      select: { id: true, name: true, email: true, role: true },
    });
    // apres ne contient jamais le mot de passe (select restreint).
    await logAction({ action: 'CREATE', entite: 'User', entiteId: user.id, apres: user }, req);
    return ok(user, 201);
  } catch (e) {
    return handleError(e);
  }
}
