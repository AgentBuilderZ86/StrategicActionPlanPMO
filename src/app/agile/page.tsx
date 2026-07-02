import { PageHeader } from '@/components/PageHeader';
import { AgileClient } from '@/components/agile/AgileClient';
import { getActivePlan } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AgilePage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Agile / SI" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan disponible.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Agile / SI" subtitle="Sprints, backlog, Kanban et indicateurs agiles" />
      <AgileClient planId={plan.id} estSI={plan.typePmo === 'SI'} />
    </div>
  );
}
