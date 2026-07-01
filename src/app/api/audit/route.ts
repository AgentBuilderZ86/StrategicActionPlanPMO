import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { requireRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/** Journal d'audit, réservé aux administrateurs (T0.4). Filtrable & paginé. */
export async function GET(req: Request) {
  try {
    const guard = await requireRole(['ADMIN']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const q = new URL(req.url).searchParams;
    const where: Prisma.AuditLogWhereInput = {};
    if (q.get('entite')) where.entite = q.get('entite')!;
    if (q.get('action')) where.action = q.get('action')!;
    if (q.get('userId')) where.userId = q.get('userId')!;
    if (q.get('from') || q.get('to')) {
      where.createdAt = {};
      if (q.get('from')) where.createdAt.gte = new Date(q.get('from')!);
      if (q.get('to')) where.createdAt.lte = new Date(q.get('to')!);
    }

    const page = Math.max(1, Number(q.get('page') ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(q.get('pageSize') ?? 50)));

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    return handleError(e);
  }
}
