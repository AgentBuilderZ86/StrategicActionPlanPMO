import type { AggAction } from '@/lib/aggregations';
import { STATUT_COLOR } from '@/lib/constants';
import { fmtDate, fmtPct } from '@/lib/utils';
import { StatutBadge, PrioriteBadge, RetardBadge } from '@/components/ui/Badges';

export function PointsAttention({ actions }: { actions: AggAction[] }) {
  if (actions.length === 0) {
    return <div className="py-8 text-center text-sm text-statut-vert">✓ Aucune action bloquée ou en retard. Plan sous contrôle.</div>;
  }
  return (
    <div className="space-y-2">
      {actions.map((a) => {
        const color = a.statut === 'BLOQUE' ? STATUT_COLOR.BLOQUE : STATUT_COLOR.A_LANCER;
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" style={{ borderLeft: `4px solid ${a.enRetard ? '#BE7200' : color}` }}>
            <div className="min-w-0 grow">
              <div className="truncate font-semibold text-ink">{a.titre}</div>
              <div className="text-xs text-slate-500">
                {a.axe} · {a.pays} · {a.entite} · {a.responsable}
                {a.commentaire ? <span className="text-slate-400"> — {a.commentaire}</span> : null}
              </div>
            </div>
            <div className="hidden sm:block"><PrioriteBadge priorite={a.priorite} /></div>
            <div className="flex flex-col items-end gap-1">
              <StatutBadge statut={a.statut} />
              {a.enRetard && <RetardBadge />}
            </div>
            <div className="w-12 text-right text-xs font-semibold tabular-nums text-ink">{fmtPct(a.avancement)}</div>
            <div className="hidden w-24 text-right text-xs text-slate-500 sm:block">{fmtDate(a.dateFin ?? null)}</div>
          </div>
        );
      })}
    </div>
  );
}
