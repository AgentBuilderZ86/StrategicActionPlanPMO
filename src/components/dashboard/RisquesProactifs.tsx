import type { RisqueAction } from '@/lib/risque';
import { NIVEAU_RISQUE_COLOR, NIVEAU_RISQUE_LABEL } from '@/lib/risque';
import { fmtPct } from '@/lib/utils';

/**
 * Alertes proactives : actions signalées par le moteur de risque AVANT le
 * retard avéré. Chaque ligne affiche le score et ses facteurs explicatifs —
 * le « pourquoi » est toujours visible, jamais de boîte noire.
 */
export function RisquesProactifs({ risques }: { risques: RisqueAction[] }) {
  if (risques.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-statut-vert">
        ✓ Aucune dérive détectée. Plan sous contrôle.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {risques.map(({ action: a, score, niveau, facteurs }) => {
        const color = NIVEAU_RISQUE_COLOR[niveau];
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div
              className="flex h-10 w-10 flex-none flex-col items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: color }}
              title={`Risque ${NIVEAU_RISQUE_LABEL[niveau].toLowerCase()}`}
            >
              <span className="font-title text-sm font-extrabold tabular-nums leading-none">{score}</span>
              <span className="text-[8px] font-semibold uppercase leading-tight opacity-90">risque</span>
            </div>
            <div className="min-w-0 grow">
              <div className="truncate font-semibold text-ink">{a.titre}</div>
              <div className="text-xs text-slate-500">
                {[a.axe, a.pays, a.entite, a.responsable].filter(Boolean).join(' · ')}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {facteurs.map((f) => (
                  <span
                    key={f.code}
                    title={f.detail}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                  >
                    {f.label}
                    <span className="tabular-nums" style={{ color }}>+{f.points}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="w-12 flex-none text-right text-xs font-semibold tabular-nums text-ink">
              {fmtPct(a.avancement)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
