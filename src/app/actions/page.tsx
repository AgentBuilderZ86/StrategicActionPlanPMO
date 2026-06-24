import { PageHeader } from '@/components/PageHeader';
import { ActionsClient } from '@/components/actions/ActionsClient';
import { ImportExportBar } from '@/components/actions/ImportExportBar';
import { getActivePlan, getReferentiels } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ActionsPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Plan d'actions" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }
  const referentiels = await getReferentiels(plan.id);

  return (
    <div>
      <PageHeader
        title="Plan d'actions"
        subtitle="Suivi, filtrage et édition des actions"
        action={<ImportExportBar planId={plan.id} />}
      />
      <ActionsClient planId={plan.id} referentiels={referentiels} />
    </div>
  );
}
