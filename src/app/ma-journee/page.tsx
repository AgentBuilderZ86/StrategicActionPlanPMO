import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { MaJourneeClient } from '@/components/ma-journee/MaJourneeClient';
import { getActivePlan, getMaJourneeData } from '@/lib/data';
import { getCurrentUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const SALUTATIONS = ['Bonjour', 'Bonjour', 'Bonjour', 'Bonsoir'];

function salutation(d: Date) {
  const h = d.getHours();
  return SALUTATIONS[h < 12 ? 0 : h < 18 ? 1 : 3];
}

export default async function MaJourneePage({
  searchParams,
}: {
  searchParams: { planId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');

  const plan = await getActivePlan(searchParams.planId);
  if (!plan) {
    return (
      <div>
        <PageHeader title="Ma journée" />
        <div className="card p-8 text-sm text-slate-500">
          Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.
        </div>
      </div>
    );
  }

  const data = await getMaJourneeData(plan.id, user);
  const now = new Date();
  const prenom = user.name?.split(' ')[0] ?? '';
  const dateFr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <PageHeader
        title={`${salutation(now)} ${prenom}`.trim()}
        subtitle={`${dateFr.charAt(0).toUpperCase()}${dateFr.slice(1)} — ${plan.nom}`}
      />
      <MaJourneeClient data={data} role={user.role} peutSaisir={user.droits.saisie} />
    </div>
  );
}
