import { PageHeader } from '@/components/PageHeader';
import { AnalysesClient } from '@/components/analyses/AnalysesClient';
import { getActivePlan, getAnalysesData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AnalysesPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Analyses multi-axes" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }
  const initial = await getAnalysesData(plan.id, 'pays', 'axe');

  return (
    <div>
      <PageHeader title="Analyses multi-axes" subtitle="Pivot dynamique, comparaisons et matrice croisée" />
      <AnalysesClient planId={plan.id} initial={initial} />
    </div>
  );
}
