import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, handleError } from '@/lib/api';
import { getCurrentUser } from '@/lib/permissions';
import { DASHBOARD_WIDGETS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const WIDGET_KEYS = DASHBOARD_WIDGETS.map((w) => w.key) as [string, ...string[]];
const configSchema = z.object({
  config: z.array(z.object({ key: z.enum(WIDGET_KEYS), visible: z.boolean() })),
});

/** Préférences de tableau de bord de l'utilisateur courant (T2.2). */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);
    const pref = await prisma.dashboardPref.findUnique({ where: { userId: user.id } });
    return ok({ config: pref ? JSON.parse(pref.config) : null });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return fail('UNAUTHENTICATED', 'Authentification requise', 401);
    const { config } = configSchema.parse(await req.json());
    const json = JSON.stringify(config);
    await prisma.dashboardPref.upsert({
      where: { userId: user.id },
      create: { userId: user.id, config: json },
      update: { config: json },
    });
    return ok({ config });
  } catch (e) {
    return handleError(e);
  }
}
