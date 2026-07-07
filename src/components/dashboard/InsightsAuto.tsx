import type { InsightPlan } from '@/lib/risque';

const INSIGHT_ICON: Record<InsightPlan['code'], string> = {
  AXE_DERIVE: '📉',
  CONCENTRATION: '🎯',
  SURCHARGE: '⚖️',
};

/** Constats de niveau plan générés automatiquement par le moteur de risque. */
export function InsightsAuto({ insights }: { insights: InsightPlan[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="grid gap-2 md:grid-cols-3" role="list" aria-label="Insights automatiques">
      {insights.map((i) => (
        <div
          key={i.code}
          role="listitem"
          className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 p-3.5"
        >
          <span aria-hidden className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-base shadow-sm">
            {INSIGHT_ICON[i.code]}
          </span>
          <p className="text-[12.5px] leading-relaxed text-slate-700">{i.message}</p>
        </div>
      ))}
    </div>
  );
}
