import { PageHeader } from '@/components/PageHeader';
import { AlertesClient } from '@/components/alertes/AlertesClient';
import { getActivePlan } from '@/lib/data';
import { getAlertes, synchroniserAlertes } from '@/lib/alertes-db';
import { getCurrentUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AlertesPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const [user, plan] = await Promise.all([getCurrentUser(), getActivePlan(searchParams.planId)]);

  if (!plan) {
    return (
      <div>
        <PageHeader title="Centre d'alertes" />
        <div className="card p-8 text-sm text-slate-500">
          Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.
        </div>
      </div>
    );
  }

  // Synchronisation idempotente au chargement : les alertes reflètent
  // toujours le dernier état du moteur de risque, sans cron obligatoire.
  const pilotage = user?.role === 'ADMIN' || user?.role === 'PMO';
  if (pilotage) await synchroniserAlertes(plan.id);
  const alertes = await getAlertes(plan.id);

  return (
    <div>
      <PageHeader
        title="Centre d'alertes"
        subtitle={`Dérives détectées par le moteur de risque — ${plan.nom}`}
      />
      <AlertesClient initial={alertes} pilotage={pilotage} />
    </div>
  );
}
