import { PageHeader } from '@/components/PageHeader';
import { PopulationsClient } from '@/components/populations/PopulationsClient';
import { getActivePlan } from '@/lib/data';
import { getPopulations } from '@/lib/populations-db';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PopulationsPage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const [user, plan] = await Promise.all([getCurrentUser(), getActivePlan(searchParams.planId)]);

  if (!plan) {
    return (
      <div>
        <PageHeader title="Populations & adoption" />
        <div className="card p-8 text-sm text-slate-500">
          Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.
        </div>
      </div>
    );
  }

  const [populations, actionsPlan] = await Promise.all([
    getPopulations(plan.id),
    prisma.action.findMany({
      where: { planId: plan.id },
      select: { id: true, titre: true, code: true, statut: true },
      orderBy: [{ niveau: 'asc' }, { ordre: 'asc' }],
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Populations & adoption"
        subtitle={`Profils agrégés et anonymisés (k ≥ 8) — ${plan.nom}`}
      />
      <PopulationsClient
        planId={plan.id}
        initial={populations}
        actionsPlan={actionsPlan}
        pilotage={user?.role === 'ADMIN' || user?.role === 'PMO'}
        nomUtilisateur={user?.name ?? 'PMO'}
      />
    </div>
  );
}
