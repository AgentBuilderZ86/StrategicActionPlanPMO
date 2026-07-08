import { PageHeader } from '@/components/PageHeader';
import { RapportActions } from '@/components/rapports/RapportActions';
import { getActivePlan, getDashboardData } from '@/lib/data';
import { construireRapport } from '@/lib/reports';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function RapportsPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Rapports" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan disponible.</div>
      </div>
    );
  }
  const data = await getDashboardData(plan.id);
  const feuilles = construireRapport(data);

  return (
    <div>
      <PageHeader
        title="Rapport de pilotage"
        subtitle={`${plan.nom} — généré le ${fmtDate(new Date())}`}
        action={<RapportActions planId={plan.id} />}
      />

      <div className="space-y-5">
        {feuilles.map((f) => (
          <div key={f.nom} className="card overflow-x-auto">
            <h2 className="mb-3 font-title text-base font-bold text-ink">{f.nom}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {f.entetes.map((e) => <th key={e} className="th">{e}</th>)}
                </tr>
              </thead>
              <tbody>
                {f.lignes.map((ligne, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {ligne.map((cell, j) => (
                      <td key={j} className={`td ${j === 0 ? 'font-medium text-ink' : 'num text-slate-600'}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
