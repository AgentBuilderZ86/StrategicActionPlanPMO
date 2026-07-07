import Link from 'next/link';
import {
  PHASES_WF,
  SEUIL_SOUFFRANCE_JOURS,
  initiativesEnSouffrance,
  labelStatut,
  matriceDomainePhase,
  type IndicateursDelivery,
} from '@/lib/ppm';
import type { InitiativeDTO } from '@/lib/ppm-db';

const fmtJ = (n: number | null) => (n === null ? '—' : `${n} j`);

/**
 * Tableau de bord DSI natif : portefeuille par domaines × phases du cycle,
 * KPIs de delivery, top valeur métier et initiatives en souffrance.
 * Rien d'hérité du PMO stratégique (ni régions, ni impact SR).
 */
export function DashboardDsi({
  initiatives,
  delivery,
}: {
  initiatives: InitiativeDTO[];
  delivery: IndicateursDelivery & { total: number };
}) {
  const actives = initiatives.filter((i) => !['DEPLOYE', 'NOGO'].includes(i.statutCycle));
  const deployees = initiatives.filter((i) => i.statutCycle === 'DEPLOYE');
  const aQualifier = initiatives.filter((i) => ['NON_QUALIFIE', 'BACKLOG'].includes(i.statutCycle));
  const budget = initiatives.reduce((s, i) => s + (i.budget ?? 0), 0);
  const matrice = matriceDomainePhase(initiatives);
  const maxCellule = Math.max(1, ...matrice.flatMap((l) => l.cellules.map((c) => c.count)));
  const topValeur = [...actives].sort((a, b) => b.valeurMetier - a.valeurMetier).slice(0, 6);
  const souffrance = initiativesEnSouffrance(initiatives).slice(0, 6);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* KPIs delivery */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <div className="tuile tuile-dsi">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Portefeuille</div>
          <div className="mt-1 font-mono text-xl font-bold">{actives.length}</div>
          <div className="text-[10px] text-white/70">en cycle · {deployees.length} déployées</div>
        </div>
        <div className="tuile tuile-cyan">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Time to delivery</div>
          <div className="mt-1 font-mono text-xl font-bold">{fmtJ(delivery.timeToDeliveryMedianJours)}</div>
          <div className="text-[10px] text-white/70">médiane création → déployé</div>
        </div>
        <div className="tuile tuile-emeraude">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Throughput</div>
          <div className="mt-1 font-mono text-xl font-bold">{delivery.throughputParMois}</div>
          <div className="text-[10px] text-white/70">déployées / mois</div>
        </div>
        <div className="tuile tuile-ambre">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">À qualifier</div>
          <div className="mt-1 font-mono text-xl font-bold">{aQualifier.length}</div>
          <div className="text-[10px] text-white/70">âge moyen {fmtJ(delivery.ageMoyenBacklogJours)}</div>
        </div>
        <div className="tuile tuile-violet">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Recette OK 1er coup</div>
          <div className="mt-1 font-mono text-xl font-bold">
            {delivery.tauxRecetteOkPremierCoup === null ? '—' : `${delivery.tauxRecetteOkPremierCoup} %`}
          </div>
          <div className="text-[10px] text-white/70">qualité des livraisons</div>
        </div>
        <div className="tuile tuile-sombre">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Budget SI</div>
          <div className="mt-1 font-mono text-xl font-bold">{budget.toLocaleString('fr-FR')}</div>
          <div className="text-[10px] text-white/70">k MAD engagés (initiatives)</div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        {/* Matrice domaines × phases */}
        <div className="card card-liseret flex flex-col p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">Portefeuille — domaines × phases</h3>
            <Link href="/pipeline" className="text-[11px] font-bold text-accent hover:underline">
              Pipeline →
            </Link>
          </div>
          <div className="scrolly mt-3">
            <table className="w-full border-separate border-spacing-1 text-[10.5px]">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-slate-500">Domaine</th>
                  {PHASES_WF.map((p) => (
                    <th key={p} className="font-semibold text-slate-500">{p}</th>
                  ))}
                  <th className="font-semibold text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrice.map((l) => (
                  <tr key={l.domaine}>
                    <th className="whitespace-nowrap text-left font-semibold text-ink">{l.domaine}</th>
                    {l.cellules.map((c) => (
                      <td
                        key={c.phase}
                        className="rounded-md py-1.5 text-center font-mono font-bold"
                        style={{
                          backgroundColor: c.count === 0 ? '#F2F6F9' : `rgba(20, 121, 217, ${0.15 + (c.count / maxCellule) * 0.55})`,
                          color: c.count / maxCellule > 0.55 ? '#fff' : '#0b5cad',
                        }}
                      >
                        {c.count || ''}
                      </td>
                    ))}
                    <td className="text-center font-mono font-bold text-ink">{l.total}</td>
                  </tr>
                ))}
                {matrice.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                      Aucune initiative — soumettez la première depuis le pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite : souffrance + top valeur */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="card card-liseret flex min-h-0 flex-1 flex-col p-4">
            <h3 className="text-sm font-bold text-ink">
              Initiatives en souffrance{' '}
              <span className="text-[10.5px] font-medium text-slate-400">
                — immobiles ≥ {SEUIL_SOUFFRANCE_JOURS} j dans leur statut
              </span>
            </h3>
            <div className="scrolly mt-2 space-y-1.5">
              {souffrance.length === 0 ? (
                <p className="py-4 text-center text-xs text-statut-vert">✓ Aucune initiative immobile. Pipeline fluide.</p>
              ) : (
                souffrance.map((i) => (
                  <Link
                    key={i.id}
                    href={`/pipeline?focus=${i.id}`}
                    className="flex items-center gap-2.5 rounded-lg bg-canvas px-2.5 py-2 text-xs hover:bg-slate-100"
                  >
                    <span className="grid h-8 w-11 flex-none place-items-center rounded-md bg-statut-ambre font-mono text-[11px] font-bold text-white">
                      {i.joursImmobile} j
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{i.titre}</span>
                      <span className="block truncate text-[10.5px] text-slate-500">
                        {labelStatut(i.mode, i.statutCycle)}
                        {i.domaine ? ` · ${i.domaine}` : ''}
                        {i.productOwner ? ` · PO : ${i.productOwner}` : ''}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card card-liseret flex min-h-0 flex-1 flex-col p-4">
            <h3 className="text-sm font-bold text-ink">Top valeur métier en cycle</h3>
            <div className="scrolly mt-2 space-y-1.5">
              {topValeur.map((i) => (
                <Link
                  key={i.id}
                  href={`/pipeline?focus=${i.id}`}
                  className="flex items-center gap-2.5 rounded-lg bg-canvas px-2.5 py-2 text-xs hover:bg-slate-100"
                >
                  <span
                    className={`grid h-7 w-7 flex-none place-items-center rounded-md font-mono text-[11px] font-bold text-white ${i.valeurMetier >= 5 ? 'bg-statut-rouge' : i.valeurMetier >= 4 ? 'bg-statut-ambre' : 'bg-statut-bleu'}`}
                  >
                    V{i.valeurMetier}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{i.titre}</span>
                    <span className="block truncate text-[10.5px] text-slate-500">
                      {labelStatut(i.mode, i.statutCycle)}
                      {i.sousDomaine ? ` · ${i.sousDomaine}` : ''}
                    </span>
                  </span>
                  <span className="flex-none text-[10.5px] font-semibold text-slate-400">{i.mode}</span>
                </Link>
              ))}
              {topValeur.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">Aucune initiative active.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
