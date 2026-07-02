import { PageHeader } from '@/components/PageHeader';
import { PlanningClient } from '@/components/planning/PlanningClient';
import { getActivePlan, getPlanningData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PlanningPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Planning" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan disponible.</div>
      </div>
    );
  }
  const data = await getPlanningData(plan.id);

  return (
    <div>
      <PageHeader title="Planning" subtitle="Vue Gantt et calendrier des actions et jalons" />
      <PlanningClient actions={data.actions} jalons={data.jalons} />
    </div>
  );
}
