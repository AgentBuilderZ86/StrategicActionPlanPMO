'use client';

import { useState } from 'react';
import type { FluxMois, PivotDomaine } from '@/lib/ppm';
import { Onglets } from '@/components/ui/Onglets';

/** Analyses DSI : le portefeuille se lit par domaines, flux et valeur —
 *  plus aucun pivot pays/axe hérité du PMO stratégique. */
export function AnalysesDsiClient({
  pivot,
  flux,
  valeurs,
}: {
  pivot: PivotDomaine[];
  flux: FluxMois[];
  valeurs: { valeur: number; count: number }[];
}) {
  const [onglet, setOnglet] = useState<'portefeuille' | 'flux' | 'valeur'>('portefeuille');
  const maxFlux = Math.max(1, ...flux.flatMap((f) => [f.soumissions, f.deploiements]));
  const maxBudget = Math.max(1, ...pivot.map((p) => p.budget));
  const maxValeur = Math.max(1, ...valeurs.map((v) => v.count));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Onglets
        onglets={[
          { key: 'portefeuille', label: 'Portefeuille par domaine' },
          { key: 'flux', label: 'Flux du pipeline' },
          { key: 'valeur', label: 'Valeur & budget' },
        ]}
        actif={onglet}
        onChange={setOnglet}
      />

      {onglet === 'portefeuille' && (
        <div className="card card-liseret scrolly flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Domaine</th>
                <th className="px-3 py-2.5 text-center">Total</th>
                <th className="px-3 py-2.5 text-center">En cycle</th>
                <th className="px-3 py-2.5 text-center">Déployées</th>
                <th className="px-3 py-2.5 text-center">Waterfall / Agile</th>
                <th className="px-3 py-2.5 text-center">Valeur moyenne</th>
                <th className="px-3 py-2.5 text-right">Budget (k MAD)</th>
              </tr>
            </thead>
            <tbody>
              {pivot.map((p) => (
                <tr key={p.domaine} className="border-t border-ligne/60 hover:bg-canvas">
                  <td className="px-3 py-2.5 font-semibold text-ink">{p.domaine}</td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold">{p.total}</td>
                  <td className="px-3 py-2.5 text-center font-mono">{p.actives}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-statut-vert">{p.deployees}</td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {p.waterfall} / {p.agile}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-grid h-6 w-9 place-items-center rounded-md font-mono text-[10.5px] font-bold text-white ${p.valeurMoyenne >= 4 ? 'bg-statut-rouge' : p.valeurMoyenne >= 3 ? 'bg-statut-ambre' : 'bg-statut-bleu'}`}>
                      {p.valeurMoyenne}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{p.budget.toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {pivot.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">Aucune initiative.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {onglet === 'flux' && (
        <div className="card card-liseret flex flex-1 flex-col p-4">
          <h3 className="text-sm font-bold text-ink">
            Soumissions vs déploiements{' '}
            <span className="text-[10.5px] font-medium text-slate-400">— un pipeline sain déploie autant qu&apos;il absorbe</span>
          </h3>
          <div className="scrolly mt-4 space-y-3">
            {flux.map((f) => (
              <div key={f.mois} className="flex items-center gap-3 text-[11px]">
                <span className="w-16 shrink-0 font-mono font-semibold text-slate-500">{f.mois}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 rounded-r bg-gradient-to-r from-[#1479D9] to-[#3B9BF0]"
                      style={{ width: `${Math.max(2, (f.soumissions / maxFlux) * 100)}%` }} />
                    <span className="font-mono text-[10px] font-bold text-statut-bleu">{f.soumissions} soumise(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 rounded-r bg-gradient-to-r from-[#0d8b50] to-[#17b978]"
                      style={{ width: `${Math.max(2, (f.deploiements / maxFlux) * 100)}%` }} />
                    <span className="font-mono text-[10px] font-bold text-statut-vert">{f.deploiements} déployée(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onglet === 'valeur' && (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <div className="card card-liseret flex flex-col p-4">
            <h3 className="text-sm font-bold text-ink">Répartition par valeur métier</h3>
            <div className="scrolly mt-3 space-y-2">
              {valeurs.map((v) => (
                <div key={v.valeur} className="flex items-center gap-2 text-[11px]">
                  <span className={`grid h-6 w-8 shrink-0 place-items-center rounded-md font-mono text-[10.5px] font-bold text-white ${v.valeur >= 5 ? 'bg-statut-rouge' : v.valeur >= 4 ? 'bg-statut-ambre' : 'bg-statut-bleu'}`}>
                    V{v.valeur}
                  </span>
                  <div className="h-4 rounded-r bg-gradient-to-r from-[#1479D9] to-[#3B9BF0]"
                    style={{ width: `${Math.max(2, (v.count / maxValeur) * 88)}%` }} />
                  <span className="font-mono text-[10.5px] font-bold">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-liseret flex flex-col p-4">
            <h3 className="text-sm font-bold text-ink">Budget engagé par domaine</h3>
            <div className="scrolly mt-3 space-y-2">
              {pivot.filter((p) => p.budget > 0).map((p) => (
                <div key={p.domaine} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 shrink-0 truncate font-semibold text-slate-500">{p.domaine}</span>
                  <div className="h-4 rounded-r bg-gradient-to-r from-[#16324f] to-[#0b5cad]"
                    style={{ width: `${Math.max(2, (p.budget / maxBudget) * 78)}%` }} />
                  <span className="font-mono text-[10.5px] font-bold tabular-nums">{p.budget.toLocaleString('fr-FR')} k</span>
                </div>
              ))}
              {pivot.every((p) => p.budget === 0) && (
                <p className="py-4 text-center text-xs text-slate-400">Aucun budget renseigné sur les initiatives.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
