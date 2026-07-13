import { PageHeader } from '@/components/PageHeader';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { getActivePlan, getReferentiels, getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function MatriceAvancementPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const plan = await getActivePlan(searchParams.planId);

  if (!plan) {
    return (
      <div>
        <PageHeader title="Matrice d'avancement" />
        <div className="card p-8 text-sm text-slate-500">
          Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.
        </div>
      </div>
    );
  }

  if (plan.typePmo === 'SI') {
    return (
      <div>
        <PageHeader title="Matrice d'avancement" subtitle={plan.nom} />
        <div className="card p-8 text-sm text-slate-500">
          Non applicable au périmètre PPM DSI (voir la matrice domaines × phases sur le tableau de bord).
        </div>
      </div>
    );
  }

  const [{ axes }, data] = await Promise.all([
    getReferentiels(plan.id),
    getDashboardData(plan.id),
  ]);

  return (
    <div>
      <PageHeader title="Matrice d'avancement" subtitle={`Région × Axe — ${plan.nom}`} />
      <Heatmap heatmap={data.heatmap} axes={axes.map((a) => ({ id: a.id, nom: a.nom }))} />
    </div>
  );
}
