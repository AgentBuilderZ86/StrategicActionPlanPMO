import { PageHeader } from '@/components/PageHeader';
import { InitiativesClient } from '@/components/ppm/InitiativesClient';
import { getActivePlan } from '@/lib/data';
import { getDomaines, getInitiatives } from '@/lib/ppm-db';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function InitiativesPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const [user, plan] = await Promise.all([getCurrentUser(), getActivePlan(searchParams.planId)]);

  if (!plan || plan.typePmo !== 'SI') {
    return (
      <div>
        <PageHeader title="Initiatives & projets" />
        <div className="card p-8 text-sm text-slate-500">Vue réservée aux plans de type SI.</div>
      </div>
    );
  }

  const [initiatives, domaines, actionsHeritees] = await Promise.all([
    getInitiatives(plan.id),
    getDomaines(plan.id),
    prisma.action.count({ where: { planId: plan.id } }),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Initiatives & projets"
        subtitle={`${plan.nom} · vue liste du portefeuille — le kanban vit dans Backlog & pipeline`}
      />
      <InitiativesClient
        initial={initiatives}
        domaines={domaines}
        pilotage={user?.role === 'ADMIN' || user?.role === 'PMO'}
        actionsHeritees={actionsHeritees}
      />
    </div>
  );
}
