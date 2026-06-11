import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function AnalysesPage() {
  return (
    <div>
      <PageHeader title="Analyses multi-axes" subtitle="Pivot dynamique et matrice croisée" />
      <div className="card p-8 text-sm text-slate-500">Analyses — implémentées en phase 4.</div>
    </div>
  );
}
