import {
  PHASES_WF,
  initiativesEnSouffrance,
  labelStatut,
  matriceDomainePhase,
  type IndicateursDelivery,
} from '@/lib/ppm';
import type { InitiativeDTO } from '@/lib/ppm-db';
import { fmtDate } from '@/lib/utils';

const fmtJ = (n: number | null) => (n === null ? '—' : `${n} j`);

/** Revue de portefeuille DSI imprimable : synthèse delivery, matrice
 *  domaines × phases, points durs et déploiements récents avec lots. */
export function RapportDsi({
  planNom,
  initiatives,
  delivery,
}: {
  planNom: string;
  initiatives: InitiativeDTO[];
  delivery: IndicateursDelivery & { total: number };
}) {
  const actives = initiatives.filter((i) => !['DEPLOYE', 'NOGO'].includes(i.statutCycle));
  const matrice = matriceDomainePhase(initiatives);
  const souffrance = initiativesEnSouffrance(initiatives).slice(0, 8);
  const deployees = initiatives
    .filter((i) => i.statutCycle === 'DEPLOYE')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);

  const kpis: [string, string][] = [
    ['Initiatives au portefeuille', String(delivery.total)],
    ['En cycle', String(actives.length)],
    ['Time to delivery (médiane)', fmtJ(delivery.timeToDeliveryMedianJours)],
    ['Throughput / mois', String(delivery.throughputParMois)],
    ['Recette OK 1er coup', delivery.tauxRecetteOkPremierCoup === null ? '—' : `${delivery.tauxRecetteOkPremierCoup} %`],
    ['Âge du backlog', fmtJ(delivery.ageMoyenBacklogJours)],
  ];

  return (
    <div className="print-page space-y-4">
      <div className="hidden items-center justify-between border-b border-slate-200 pb-3 print:flex">
        <h1 className="font-title text-xl font-extrabold text-ink">{planNom} — Revue de portefeuille DSI</h1>
        <span className="text-sm text-slate-500">{fmtDate(new Date())}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {kpis.map(([label, valeur]) => (
          <div key={label} className="card p-3">
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-ink">{valeur}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <div className="card card-liseret p-4">
          <h3 className="text-sm font-bold text-ink">Portefeuille — domaines × phases</h3>
          <table className="mt-2 w-full border-separate border-spacing-1 text-[10.5px]">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-500">Domaine</th>
                {PHASES_WF.map((p) => <th key={p} className="font-semibold text-slate-500">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrice.map((l) => (
                <tr key={l.domaine}>
                  <th className="whitespace-nowrap text-left font-semibold text-ink">{l.domaine}</th>
                  {l.cellules.map((c) => (
                    <td key={c.phase} className="rounded bg-canvas py-1 text-center font-mono font-bold">
                      {c.count || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-liseret p-4">
          <h3 className="text-sm font-bold text-ink">Points durs (immobiles ≥ 21 j)</h3>
          {souffrance.length === 0 ? (
            <p className="mt-3 text-xs text-statut-vert">✓ Aucun blocage prolongé.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-xs">
              {souffrance.map((i) => (
                <li key={i.id} className="flex items-baseline gap-2">
                  <span className="w-11 shrink-0 font-mono font-bold text-statut-ambre">{i.joursImmobile} j</span>
                  <span className="min-w-0">
                    <b className="text-ink">{i.titre}</b>
                    <span className="text-slate-500"> — {labelStatut(i.mode, i.statutCycle)}{i.productOwner ? ` · PO ${i.productOwner}` : ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card card-liseret p-4">
        <h3 className="text-sm font-bold text-ink">Déploiements récents (lots)</h3>
        {deployees.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">Aucune initiative déployée pour l&apos;instant.</p>
        ) : (
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-3">Initiative</th>
                <th className="py-1.5 pr-3">Domaine</th>
                <th className="py-1.5 pr-3">Mode</th>
                <th className="py-1.5 pr-3">Lot / release</th>
                <th className="py-1.5">Déployée le</th>
              </tr>
            </thead>
            <tbody>
              {deployees.map((i) => (
                <tr key={i.id} className="border-t border-ligne/60">
                  <td className="py-1.5 pr-3 font-semibold text-ink">{i.titre}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{i.domaine ?? '—'}</td>
                  <td className="py-1.5 pr-3">{i.mode}</td>
                  <td className="py-1.5 pr-3 font-mono">{i.lot ?? '—'}</td>
                  <td className="py-1.5 text-slate-600">{fmtDate(i.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
