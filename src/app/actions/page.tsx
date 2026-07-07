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

  const bandeauSi =
    plan?.typePmo === 'SI' ? (
      <div className="card mb-3 px-4 py-2.5 text-xs text-slate-600">
        💡 Pour l&apos;univers DSI, cet écran est remplacé par{' '}
        <a href="/initiatives" className="font-bold text-accent hover:underline">Initiatives &amp; projets</a>{' '}
        (domaines, cycles de delivery). Celui-ci reste accessible pour l&apos;héritage.
      </div>
    ) : null;

  return (
    <div>
      <PageHeader
        title="Plan d'actions"
        subtitle="Suivi, filtrage et édition des actions"
        action={<ImportExportBar planId={plan.id} />}
      />
      {bandeauSi}
      <ActionsClient planId={plan.id} referentiels={referentiels} />
    </div>
  );
}
