'use client';

import { useCallback, useEffect, useState } from 'react';
import { DIMENSIONS, type DimensionKey } from '@/lib/constants';
import type { AnalysesData } from '@/lib/data';
import type { ActionDTO } from '@/lib/types';
import { fmtMoney, fmtDate, heatColor } from '@/lib/utils';
import { SectionCard } from '@/components/ui/Cards';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatutBadge } from '@/components/ui/Badges';
import { Drawer } from '@/components/ui/Drawer';
import { ComparAvancement, ComparBudget } from './AnalysesCharts';

// Mapping dimension → paramètre de filtre de /api/actions pour le drill-down
const FILTER_PARAM: Record<DimensionKey, string> = {
  pays: 'paysId',
  entite: 'entiteId',
  axe: 'axeId',
  responsable: 'responsable',
  priorite: 'priorite',
};

export function AnalysesClient({ planId, initial }: { planId: string; initial: AnalysesData }) {
  const [dim, setDim] = useState<DimensionKey>(initial.dim);
  const [dim2, setDim2] = useState<DimensionKey>(initial.dim2);
  const [data, setData] = useState<AnalysesData>(initial);
  const [loading, setLoading] = useState(false);

  // Drill-down
  const [drill, setDrill] = useState<{ label: string; actions: ActionDTO[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ planId, dim, dim2 });
    const res = await fetch(`/api/analyses?${p.toString()}`, { cache: 'no-store' });
    setData(await res.json());
    setLoading(false);
  }, [planId, dim, dim2]);

  useEffect(() => {
    if (dim === initial.dim && dim2 === initial.dim2) return;
    load();
  }, [load, dim, dim2, initial.dim, initial.dim2]);

  const openDrill = async (key: string, label: string) => {
    const p = new URLSearchParams({ planId, pageSize: '200' });
    p.set(FILTER_PARAM[dim], key);
    const res = await fetch(`/api/actions?${p.toString()}`, { cache: 'no-store' });
    const body = await res.json();
    setDrill({ label, actions: body.data ?? [] });
  };

  const dimLabel = DIMENSIONS.find((d) => d.key === dim)?.label ?? dim;
  const dim2Label = DIMENSIONS.find((d) => d.key === dim2)?.label ?? dim2;
  const { cross } = data;

  return (
    <div className="space-y-5">
      {/* Sélecteurs */}
      <div className="card flex flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label" htmlFor="dim">Dimension d&apos;analyse</label>
          <select id="dim" className="input w-auto" value={dim} onChange={(e) => setDim(e.target.value as DimensionKey)}>
            {DIMENSIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <div className="text-slate-400">×</div>
        <div>
          <label className="label" htmlFor="dim2">Dimension croisée</label>
          <select id="dim2" className="input w-auto" value={dim2} onChange={(e) => setDim2(e.target.value as DimensionKey)}>
            {DIMENSIONS.filter((d) => d.key !== dim).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        {loading && <span className="text-xs text-slate-400">Actualisation…</span>}
      </div>

      {/* Tableau de synthèse */}
      <SectionCard title={`Synthèse par ${dimLabel.toLowerCase()}`} subtitle="Cliquez sur une ligne pour voir les actions correspondantes.">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="th">{dimLabel}</th>
                <th className="th">Actions</th>
                <th className="th">Avancement</th>
                <th className="th">Terminées</th>
                <th className="th">Bloquées</th>
                <th className="th">En retard</th>
                <th className="th">Budget</th>
              </tr>
            </thead>
            <tbody>
              {data.pivot.map((g) => (
                <tr key={g.key} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => openDrill(g.key, g.label)}>
                  <td className="td font-semibold text-ink">{g.label}</td>
                  <td className="td tabular-nums">{g.count}</td>
                  <td className="td w-48"><ProgressBar value={g.avancementMoyen} /></td>
                  <td className="td tabular-nums font-semibold text-statut-vert">{g.terminees}</td>
                  <td className="td tabular-nums font-semibold text-statut-rouge">{g.bloquees}</td>
                  <td className="td tabular-nums font-semibold text-statut-ambre">{g.enRetard}</td>
                  <td className="td whitespace-nowrap tabular-nums font-semibold">{fmtMoney(g.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Graphiques comparés */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title={`Avancement par ${dimLabel.toLowerCase()}`}>
          <ComparAvancement data={data.pivot} />
        </SectionCard>
        <SectionCard title={`Budget par ${dimLabel.toLowerCase()}`}>
          <ComparBudget data={data.pivot} />
        </SectionCard>
      </div>

      {/* Matrice croisée */}
      <SectionCard
        title={`Matrice croisée — ${dimLabel} × ${dim2Label}`}
        subtitle="Avancement moyen par croisement (couleur) et nombre d'actions."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-bold text-ink">{dimLabel}</th>
                {cross.cols.map((c) => (
                  <th key={c.key} className="p-2 text-center text-[11px] font-semibold text-slate-500" style={{ minWidth: 90 }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cross.rows.map((r) => (
                <tr key={r.key}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white p-2 text-xs font-semibold text-ink">{r.label}</td>
                  {cross.cols.map((c) => {
                    const cell = cross.cells[r.key]?.[c.key] ?? { count: 0, avancement: 0 };
                    const { bg, fg } = heatColor(cell.avancement, cell.count);
                    return (
                      <td key={c.key} className="p-1">
                        <div className="flex h-11 flex-col items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: bg, color: fg }} title={`${r.label} · ${c.label}\n${cell.count} action(s) · ${cell.avancement}%`}>
                          {cell.count ? <><span>{cell.avancement}%</span><span className="text-[10px] font-medium opacity-80">{cell.count}</span></> : <span className="text-[10px]">—</span>}
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

      {/* Drill-down */}
      <Drawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `Actions — ${drill.label}` : ''}>
        <div className="space-y-2">
          {drill?.actions.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-ink">{a.titre}</div>
                <StatutBadge statut={a.statut} />
              </div>
              <div className="mt-1 text-xs text-slate-500">{a.axe} · {a.pays} · {a.entite} · {a.responsable}</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="grow"><ProgressBar value={a.avancement} /></div>
                <div className="text-xs text-slate-500">Échéance {fmtDate(a.dateFin)}</div>
                <div className="text-xs font-semibold">{fmtMoney(a.budget)}</div>
              </div>
            </div>
          ))}
          {drill?.actions.length === 0 && <p className="text-sm text-slate-400">Aucune action.</p>}
          {drill && drill.actions.length > 0 && (
            <p className="pt-1 text-xs text-slate-400">{drill.actions.length} action(s)</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
