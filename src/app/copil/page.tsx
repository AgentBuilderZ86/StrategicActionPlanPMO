import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function CopilPage() {
  return (
    <div>
      <PageHeader title="Vue COPIL" subtitle="Synthèse exécutive imprimable" />
      <div className="card p-8 text-sm text-slate-500">Vue COPIL — implémentée en phase 6.</div>
    </div>
  );
}
