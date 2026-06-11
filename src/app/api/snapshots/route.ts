import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { snapshotSchema } from '@/lib/zod';
import { requireRole } from '@/lib/permissions';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const planId = new URL(req.url).searchParams.get('planId');
    if (!planId) return fail('VALIDATION', 'planId requis', 422);
    const snapshots = await prisma.snapshotCopil.findMany({
      where: { planId },
      orderBy: { createdAt: 'desc' },
    });
    return ok(snapshots);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRole(['ADMIN', 'PMO']);
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const parsed = snapshotSchema.parse(await req.json());
    const data = await getDashboardData(parsed.planId);
    const indicateurs = JSON.stringify({
      kpis: data.kpis,
      parAxe: data.parAxe,
      capturedAt: new Date().toISOString(),
    });

    const snapshot = await prisma.snapshotCopil.create({
      data: {
        planId: parsed.planId,
        periode: parsed.periode,
        faitsMarquants: parsed.faitsMarquants ?? null,
        indicateurs,
      },
    });
    return ok(snapshot, 201);
  } catch (e) {
    return handleError(e);
  }
}
