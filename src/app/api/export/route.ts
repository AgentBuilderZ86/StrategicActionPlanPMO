import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { fail, handleError } from '@/lib/api';
import { ACTION_INCLUDE, serializeAction } from '@/lib/serialize';
import { toCSV, EXPORT_HEADERS, actionToRow } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') ?? 'csv';
    const planId = url.searchParams.get('planId') ?? undefined;

    const rows = await prisma.action.findMany({
      where: planId ? { planId } : undefined,
      include: ACTION_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    const actions = rows.map(serializeAction);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      const aoa = [EXPORT_HEADERS as unknown as string[], ...actions.map(actionToRow)];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Actions');
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="actions-${stamp}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      return new Response(toCSV(actions), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="actions-${stamp}.csv"`,
        },
      });
    }

    return fail('BAD_FORMAT', 'Format non supporté (csv|xlsx)', 400);
  } catch (e) {
    return handleError(e);
  }
}
