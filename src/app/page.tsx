import { PageHeader } from '@/components/PageHeader';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getActivePlan, getPlans, getReferentiels, getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const plans = await getPlans();
  const plan = (await getActivePlan(searchParams.planId)) ?? plans[0];

  if (!plan) {
    return (
      <div>
        <PageHeader title="Tableau de bord exécutif" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }

  const [{ axes }, data] = await Promise.all([
    getReferentiels(plan.id),
    getDashboardData(plan.id),
  ]);

  return (
    <div>
      <PageHeader title="Tableau de bord exécutif" subtitle={`Vue d’ensemble — ${plan.nom}`} />
      <DashboardClient
        plans={plans.map((p) => ({ id: p.id, nom: p.nom }))}
        planId={plan.id}
        axes={axes.map((a) => ({ id: a.id, nom: a.nom }))}
        initial={data}
      />
    </div>
  );
}
