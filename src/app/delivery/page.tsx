import { PageHeader } from '@/components/PageHeader';
import { getActivePlan } from '@/lib/data';
import { getDelivery } from '@/lib/ppm-db';
import { CYCLE_WATERFALL, labelStatut } from '@/lib/ppm';

export const dynamic = 'force-dynamic';

const fmtJ = (n: number | null) => (n === null ? '—' : `${n} j`);

export default async function DeliveryPage({ searchParams }: { searchParams: { planId?: string } }) {
  const plan = await getActivePlan(searchParams.planId);
  if (!plan || plan.typePmo !== 'SI') {
    return (
      <div>
        <PageHeader title="Indicateurs delivery" />
        <div className="card p-8 text-sm text-slate-500">Vue réservée aux plans de type SI.</div>
      </div>
    );
  }

  const d = await getDelivery(plan.id);
  const phases = [...new Set(CYCLE_WATERFALL.filter((e) => e.statut !== 'NOGO').map((e) => e.phase))];
  const wipPhase = (phase: string) =>
    CYCLE_WATERFALL.filter((e) => e.phase === phase).reduce(
      (s, e) => s + (d.wipParStatut.get(e.statut) ?? 0),
      0,
    );
  const maxWip = Math.max(1, ...phases.map(wipPhase));
  const leads = [...d.leadTimes.entries()]
    .filter(([statut]) => !['DEPLOYE', 'NOGO'].includes(statut))
    .sort((a, b) => b[1] - a[1]);
  const maxLead = Math.max(1, ...leads.map(([, v]) => v));
  const phasesMetier = ['A_SPECIFIER_METIER', 'RECETTE_EN_COURS', 'RECETTE_METIER', 'A_VALIDER'];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PageHeader
        title="Indicateurs delivery"
        subtitle={`${plan.nom} · ${d.total} initiatives · mesuré sur l'historique réel des transitions`}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        <div className="tuile tuile-dsi">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Time to delivery</div>
          <div className="mt-1 font-mono text-xl font-bold">{fmtJ(d.timeToDeliveryMedianJours)}</div>
          <div className="text-[10px] text-white/70">médiane création → déployé</div>
        </div>
        <div className="tuile tuile-cyan">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Throughput</div>
          <div className="mt-1 font-mono text-xl font-bold">{d.throughputParMois}</div>
          <div className="text-[10px] text-white/70">déployées / mois (6 mois)</div>
        </div>
        <div className="tuile tuile-emeraude">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Recette OK 1er coup</div>
          <div className="mt-1 font-mono text-xl font-bold">
            {d.tauxRecetteOkPremierCoup === null ? '—' : `${d.tauxRecetteOkPremierCoup} %`}
          </div>
          <div className="text-[10px] text-white/70">sans retour en réalisation</div>
        </div>
        <div className="tuile tuile-violet">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">WIP total</div>
          <div className="mt-1 font-mono text-xl font-bold">
            {[...d.wipParStatut.values()].reduce((s, v) => s + v, 0)}
          </div>
          <div className="text-[10px] text-white/70">initiatives en cours de cycle</div>
        </div>
        <div className="tuile tuile-sombre">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Âge du backlog</div>
          <div className="mt-1 font-mono text-xl font-bold">{fmtJ(d.ageMoyenBacklogJours)}</div>
          <div className="text-[10px] text-white/70">non qualifié, en moyenne</div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="card card-liseret flex flex-col p-4">
          <h3 className="text-sm font-bold text-ink">Pipeline par phase (WIP)</h3>
          <div className="scrolly mt-3 space-y-2">
            {phases.map((phase) => (
              <div key={phase} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 text-right font-semibold text-slate-500">{phase}</span>
                <div
                  className="flex h-6 items-center rounded-md bg-gradient-to-r from-[#1479D9] to-[#3B9BF0] px-2 font-mono text-[11px] font-bold text-white"
                  style={{ width: `${Math.max(8, (wipPhase(phase) / maxWip) * 100)}%` }}
                >
                  {wipPhase(phase)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-liseret flex flex-col p-4">
          <h3 className="text-sm font-bold text-ink">
            Lead time moyen par statut{' '}
            <span className="text-[10.5px] font-medium text-slate-400">— où ça coince</span>
          </h3>
          <div className="scrolly mt-3 space-y-1.5">
            {leads.length === 0 && (
              <p className="text-xs text-slate-400">
                Pas encore d&apos;historique : les lead times apparaîtront dès les premières transitions.
              </p>
            )}
            {leads.map(([statut, jours]) => (
              <div key={statut} className="flex items-center gap-2 text-[11px]">
                <span className="w-36 shrink-0 truncate font-semibold text-slate-500">
                  {labelStatut('WATERFALL', statut) === statut ? labelStatut('AGILE', statut) : labelStatut('WATERFALL', statut)}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(jours / maxLead) * 100}%`,
                      backgroundColor: phasesMetier.includes(statut) ? '#BE7200' : '#1479D9',
                    }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-xs font-bold tabular-nums">{jours} j</span>
              </div>
            ))}
            {leads.length > 0 && (
              <p className="pt-2 text-[10.5px] text-slate-500">
                🟠 Statuts côté <b>métier</b> (specs, validation, recette) : c&apos;est le levier n°1 du
                time to delivery — les notifications ciblées PO / key users servent à les réduire.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
