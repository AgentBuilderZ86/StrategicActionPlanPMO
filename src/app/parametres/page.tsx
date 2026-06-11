import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function ParametresPage() {
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Référentiels, utilisateurs et données" />
      <div className="card p-8 text-sm text-slate-500">Paramètres — implémentés en phases 2 et 5.</div>
    </div>
  );
}
