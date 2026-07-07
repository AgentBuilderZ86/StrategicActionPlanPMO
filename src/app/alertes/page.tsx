import { PageHeader } from '@/components/PageHeader';
import { AlertesClient } from '@/components/alertes/AlertesClient';
import { getActivePlan } from '@/lib/data';
import { getAlertes } from '@/lib/alertes-db';
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

  // Dette #3 : la synchronisation n'est plus faite au chargement (latence,
  // écritures concurrentes). Elle passe par le bouton « Actualiser » (POST
  // /api/alertes) — un cron quotidien prendra le relais (phase 3).
  const pilotage = user?.role === 'ADMIN' || user?.role === 'PMO';
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
