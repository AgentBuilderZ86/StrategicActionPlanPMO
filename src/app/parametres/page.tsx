import { PageHeader } from '@/components/PageHeader';
import { ParametresClient } from '@/components/parametres/ParametresClient';
import { getActivePlan } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Paramètres" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Référentiels, utilisateurs et données" />
      <ParametresClient planId={plan.id} planNom={plan.nom} />
    </div>
  );
}
