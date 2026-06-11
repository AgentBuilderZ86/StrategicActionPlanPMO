import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';
import { roleEnum } from '@/lib/zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ role: roleEnum.optional(), perimetrePays: z.string().nullable().optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);
    const parsed = schema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed,
      select: { id: true, name: true, email: true, role: true },
    });
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}
