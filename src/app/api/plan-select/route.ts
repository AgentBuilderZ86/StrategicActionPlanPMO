import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser } from '@/lib/permissions';
import { PLAN_COOKIE } from '@/lib/plan-context';

export const dynamic = 'force-dynamic';

const schema = z.object({ planId: z.string().min(1) });

/** Persiste le plan sélectionné par l'utilisateur (cookie), lu par toutes les
 *  pages/routes via `getActivePlan()` (voir PlanSwitcher, en-tête). */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);

    const { planId } = schema.parse(await req.json());
    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) return fail('NOT_FOUND', 'Plan introuvable', 404);

    cookies().set(PLAN_COOKIE, plan.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return ok({ ok: true, planId: plan.id });
  } catch (e) {
    return handleError(e);
  }
}
