import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function ActionsPage() {
  return (
    <div>
      <PageHeader title="Plan d’actions" subtitle="Suivi et édition des actions" />
      <div className="card p-8 text-sm text-slate-500">Plan d’actions — implémenté en phase 2.</div>
    </div>
  );
}
