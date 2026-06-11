import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Tableau de bord exécutif" subtitle="Vue d’ensemble du plan d’action stratégique" />
      <div className="card p-8 text-sm text-slate-500">Tableau de bord — implémenté en phase 3.</div>
    </div>
  );
}
