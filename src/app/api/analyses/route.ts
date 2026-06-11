import { ok, fail, handleError } from '@/lib/api';
import { getActivePlan, getAnalysesData } from '@/lib/data';
import { DIMENSIONS, type DimensionKey } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const VALID = new Set(DIMENSIONS.map((d) => d.key));

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const planId = q.get('planId') ?? (await getActivePlan())?.id;
    if (!planId) return fail('NOT_FOUND', 'Aucun plan disponible', 404);

    const dim = (q.get('dim') ?? 'pays') as DimensionKey;
    const dim2 = (q.get('dim2') ?? 'axe') as DimensionKey;
    if (!VALID.has(dim) || !VALID.has(dim2)) return fail('VALIDATION', 'Dimension invalide', 422);

    const data = await getAnalysesData(planId, dim, dim2, { from: q.get('from'), to: q.get('to') });
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
