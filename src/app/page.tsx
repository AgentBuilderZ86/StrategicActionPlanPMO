import { PageHeader } from '@/components/PageHeader';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { PlanBanner } from '@/components/dashboard/PlanBanner';
import { getActivePlan, getReferentiels, getDashboardData, getAgileSnapshot } from '@/lib/data';

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

  const [{ axes }, data, agile] = await Promise.all([
    getReferentiels(plan.id),
    getDashboardData(plan.id),
    plan.typePmo === 'SI' ? getAgileSnapshot(plan.id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PlanBanner plan={plan} kpis={data.kpis} agile={agile} />
      <DashboardClient planId={plan.id} axes={axes.map((a) => ({ id: a.id, nom: a.nom }))} initial={data} />
    </div>
  );
}
