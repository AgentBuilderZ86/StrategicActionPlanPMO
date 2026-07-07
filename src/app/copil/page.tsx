import { PageHeader } from '@/components/PageHeader';
import { KpiCard, SectionCard } from '@/components/ui/Cards';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { PointsAttention } from '@/components/dashboard/PointsAttention';
import { CopilActions } from '@/components/copil/CopilActions';
import { getActivePlan, getReferentiels, getDashboardData } from '@/lib/data';
import { getAlertes } from '@/lib/alertes-db';
import { getPopulations } from '@/lib/populations-db';
import { ALERTE_STATUT_LABEL, facteurPrincipal, type AlerteStatut } from '@/lib/alertes';
import { populationsSousTension } from '@/lib/populations';
import { NIVEAU_RISQUE_COLOR, type NiveauRisque } from '@/lib/risque';
import { prisma } from '@/lib/prisma';
import { fmtMoney, fmtPct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CopilPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Vue COPIL" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }

  const [{ axes }, data, lastSnapshot, alertes, populations] = await Promise.all([
    getReferentiels(plan.id),
    getDashboardData(plan.id),
    prisma.snapshotCopil.findFirst({ where: { planId: plan.id }, orderBy: { createdAt: 'desc' } }),
    getAlertes(plan.id),
    getPopulations(plan.id),
  ]);

  const alertesOuvertes = alertes
    .filter((a) => a.statut === 'NOUVELLE' || a.statut === 'PRISE_EN_CHARGE')
    .slice(0, 5);
  const risquesAcceptes = alertes.filter((a) => a.statut === 'ACCEPTEE').length;
  const tensions = populationsSousTension(populations).slice(0, 4);

  const k = data.kpis;
  const consoPct = k.budgetTotal > 0 ? (k.budgetConso / k.budgetTotal) * 100 : 0;
  const top5 = data.attention.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Vue COPIL"
        subtitle={`Synthèse exécutive — ${plan.nom}`}
      />

      <CopilActions planId={plan.id} initialFaits={lastSnapshot?.faitsMarquants ?? ''} />

      <div className="print-page space-y-5">
        <div className="hidden items-center justify-between border-b border-slate-200 pb-3 print:flex">
          <h1 className="font-title text-xl font-extrabold text-ink">{plan.nom} — Comité de pilotage</h1>
          <span className="text-sm text-slate-500">{new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
          <KpiCard label="Actions" value={k.total} />
          <KpiCard label="Avancement" value={fmtPct(k.avancementMoyen)} accent="#1E4FD8" />
          <KpiCard label="Terminées" value={k.terminees} accent="#1B9E62" />
          <KpiCard label="Bloquées" value={k.bloquees} accent="#D64545" />
          <KpiCard label="En retard" value={k.enRetard} accent="#E8A13D" />
          <KpiCard label="Budget" value={fmtMoney(k.budgetTotal)} sub={`Consommé ${fmtPct(consoPct)}`} />
        </div>

        {/* Heatmap */}
        <Heatmap heatmap={data.heatmap} axes={axes.map((a) => ({ id: a.id, nom: a.nom }))} />

        {/* Top 5 points d'attention */}
        <SectionCard title="Top 5 points d'attention" subtitle="Actions bloquées ou en retard les plus prioritaires">
          <PointsAttention actions={top5} />
        </SectionCard>

        {/* Alertes du moteur de risque */}
        <SectionCard
          title="Alertes ouvertes"
          subtitle={`Dérives détectées par le moteur de risque${risquesAcceptes ? ` · ${risquesAcceptes} risque(s) accepté(s) tracé(s)` : ''}`}
        >
          {alertesOuvertes.length === 0 ? (
            <div className="py-4 text-center text-sm text-statut-vert">✓ Aucune alerte ouverte.</div>
          ) : (
            <div className="space-y-2">
              {alertesOuvertes.map((a) => {
                const color = NIVEAU_RISQUE_COLOR[a.niveau as NiveauRisque] ?? '#64748B';
                const principal = facteurPrincipal(a.facteurs);
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" style={{ borderLeft: `4px solid ${color}` }}>
                    <span className="w-10 shrink-0 text-center font-title text-sm font-extrabold tabular-nums" style={{ color }}>
                      {a.score}
                    </span>
                    <div className="min-w-0 grow">
                      <div className="truncate text-sm font-semibold text-ink">{a.action.titre}</div>
                      {principal && (
                        <div className="text-xs text-slate-500">
                          {principal.label} — {principal.detail}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {ALERTE_STATUT_LABEL[a.statut as AlerteStatut] ?? a.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Populations sous tension */}
        <SectionCard
          title="Populations sous tension"
          subtitle="Réceptivité faible ou saturation de changement — arbitrages d'accompagnement à prévoir"
        >
          {tensions.length === 0 ? (
            <div className="py-4 text-center text-sm text-statut-vert">
              ✓ Aucune population en difficulté d&apos;adoption détectée.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {tensions.map((t) => (
                <div key={t.nom} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{t.nom}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: t.receptivite >= 50 ? '#E8A13D' : '#D64545' }}>
                      Réceptivité {t.receptivite}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t.charge} changement{t.charge > 1 ? 's' : ''} actif{t.charge > 1 ? 's' : ''}
                    {t.saturee && ' · saturation'}
                    {t.adhesion != null && ` · adhésion ${t.adhesion} %`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
