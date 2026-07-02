import * as XLSX from 'xlsx';
import { ok, fail, handleError } from '@/lib/api';
import { requireDroit } from '@/lib/permissions';
import { getActivePlan, getDashboardData } from '@/lib/data';
import { construireRapport } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/**
 * Rapport de pilotage multiformat (T3.2, exig. 22, 28). Réservé au droit
 * « reporting ». Peut être déclenché par un cron pour une génération planifiée.
 */
export async function GET(req: Request) {
  try {
    const guard = await requireDroit('reporting');
    if (!guard.ok) return fail(guard.code, guard.message, guard.status);

    const url = new URL(req.url);
    const format = url.searchParams.get('format') ?? 'xlsx';
    const planId = url.searchParams.get('planId') ?? (await getActivePlan())?.id;
    if (!planId) return fail('NOT_FOUND', 'Aucun plan disponible', 404);

    const data = await getDashboardData(planId);
    const feuilles = construireRapport(data);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') return ok({ planId, generatedAt: new Date().toISOString(), feuilles });

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      for (const f of feuilles) {
        const ws = XLSX.utils.aoa_to_sheet([f.entetes, ...f.lignes]);
        XLSX.utils.book_append_sheet(wb, ws, f.nom.slice(0, 31));
      }
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="rapport-pilotage-${stamp}.xlsx"`,
        },
      });
    }

    return fail('BAD_FORMAT', 'Format non supporté (xlsx|json)', 400);
  } catch (e) {
    return handleError(e);
  }
}
