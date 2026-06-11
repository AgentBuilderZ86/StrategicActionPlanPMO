import { PageHeader } from '@/components/PageHeader';
import { KpiCard, SectionCard } from '@/components/ui/Cards';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { PointsAttention } from '@/components/dashboard/PointsAttention';
import { CopilActions } from '@/components/copil/CopilActions';
import { getActivePlan, getReferentiels, getDashboardData } from '@/lib/data';
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

  const [{ axes }, data, lastSnapshot] = await Promise.all([
    getReferentiels(plan.id),
    getDashboardData(plan.id),
    prisma.snapshotCopil.findFirst({ where: { planId: plan.id }, orderBy: { createdAt: 'desc' } }),
  ]);

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
        <SectionCard title="Top 5 points d’attention" subtitle="Actions bloquées ou en retard les plus prioritaires">
          <PointsAttention actions={top5} />
        </SectionCard>
      </div>
    </div>
  );
}
