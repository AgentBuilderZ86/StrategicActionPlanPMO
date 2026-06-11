import type { HeatRow } from '@/lib/aggregations';
import { heatColor } from '@/lib/utils';
import { SectionCard } from '@/components/ui/Cards';

export function Heatmap({ heatmap, axes }: { heatmap: HeatRow[]; axes: { id: string; nom: string }[] }) {
  return (
    <SectionCard
      title="Matrice d’avancement — Pays × Axes"
      subtitle="Avancement moyen par cellule (rouge → ambre → vert). Survol pour le détail."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-bold text-ink">Pays</th>
              {axes.map((ax) => (
                <th key={ax.id} className="p-2 text-center align-bottom text-[11px] font-semibold text-slate-500" style={{ minWidth: 92 }}>
                  {ax.nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.map((row) => (
              <tr key={row.paysId}>
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white p-2 text-xs font-semibold text-ink">{row.pays}</td>
                {row.cells.map((cell) => {
                  const { bg, fg } = heatColor(cell.pct, cell.count);
                  return (
                    <td key={cell.axeId} className="p-1">
                      <div
                        className="flex h-12 flex-col items-center justify-center rounded-lg text-xs font-bold"
                        style={{ backgroundColor: bg, color: fg }}
                        title={`${row.pays} · ${cell.axe}\n${cell.count} action(s) · ${cell.pct}% d'avancement`}
                      >
                        {cell.count ? (
                          <>
                            <span>{cell.pct}%</span>
                            <span className="text-[10px] font-medium opacity-80">{cell.count} act.</span>
                          </>
                        ) : (
                          <span className="text-[10px] font-medium">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
