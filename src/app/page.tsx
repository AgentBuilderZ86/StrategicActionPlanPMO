import { PageHeader } from '@/components/PageHeader';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { PlanBanner } from '@/components/dashboard/PlanBanner';
import { getActivePlan, getDashboardData, getAgileSnapshot } from '@/lib/data';
import { DashboardDsi } from '@/components/ppm/DashboardDsi';
import { getDelivery, getInitiatives } from '@/lib/ppm-db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const plan = await getActivePlan(searchParams.planId);

  if (!plan) {
    return (
      <div>
        <PageHeader title="Tableau de bord exécutif" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }

  // Univers PPM DSI : tableau de bord natif (domaines × phases, delivery),
  // sans aucun héritage du dashboard stratégique (régions, impact SR).
  if (plan.typePmo === 'SI') {
    const [initiatives, delivery] = await Promise.all([getInitiatives(plan.id), getDelivery(plan.id)]);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader title="Tableau de bord DSI" subtitle={`${plan.nom} · portefeuille & delivery`} />
        <DashboardDsi initiatives={initiatives} delivery={delivery} />
      </div>
    );
  }

  const [data, agile] = await Promise.all([
    getDashboardData(plan.id),
    plan.typePmo === 'SI' ? getAgileSnapshot(plan.id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader title="Tableau de bord exécutif" subtitle={`Vue d’ensemble — ${plan.nom}`} />
      <PlanBanner plan={plan} avancementMoyen={data.kpis.avancementMoyen} agile={agile} />
      <DashboardClient planId={plan.id} initial={data} />
    </div>
  );
}
