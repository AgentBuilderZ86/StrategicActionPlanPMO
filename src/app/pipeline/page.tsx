import { PageHeader } from '@/components/PageHeader';
import { PipelineClient } from '@/components/ppm/PipelineClient';
import { getActivePlan } from '@/lib/data';
import { getDomaines, getInitiatives } from '@/lib/ppm-db';
import { getCurrentUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { planId?: string; focus?: string };
}) {
  const [user, plan] = await Promise.all([getCurrentUser(), getActivePlan(searchParams.planId)]);

  if (!plan || plan.typePmo !== 'SI') {
    return (
      <div>
        <PageHeader title="Backlog & pipeline" />
        <div className="card p-8 text-sm text-slate-500">
          Cette vue est réservée aux plans de type SI. Sélectionnez le plan DSI dans l&apos;en-tête.
        </div>
      </div>
    );
  }

  const [initiatives, domaines] = await Promise.all([getInitiatives(plan.id), getDomaines(plan.id)]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Backlog & pipeline"
        subtitle={`${plan.nom} · ${initiatives.length} initiatives · coordination DSI ↔ métiers`}
      />
      <PipelineClient
        planId={plan.id}
        initial={initiatives}
        domaines={domaines}
        peutSaisir={Boolean(user?.droits.saisie)}
        focusId={searchParams.focus ?? null}
      />
    </div>
  );
}
