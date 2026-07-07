import { PageHeader } from '@/components/PageHeader';
import { AnalysesClient } from '@/components/analyses/AnalysesClient';
import { getActivePlan, getAnalysesData } from '@/lib/data';
import { AnalysesDsiClient } from '@/components/ppm/AnalysesDsiClient';
import { getInitiatives } from '@/lib/ppm-db';
import { fluxMensuel, pivotParDomaine } from '@/lib/ppm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AnalysesPage() {
  const plan = await getActivePlan();
  if (!plan) {
    return (
      <div>
        <PageHeader title="Analyses multi-axes" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }
  // Univers DSI : analyses du portefeuille d'initiatives (domaines, flux, valeur).
  if (plan.typePmo === 'SI') {
    const [initiatives, transitions] = await Promise.all([
      getInitiatives(plan.id),
      prisma.transitionCycle.findMany({
        where: { initiative: { planId: plan.id } },
        select: { initiativeId: true, de: true, vers: true, createdAt: true },
      }),
    ]);
    const valeurs = [5, 4, 3, 2, 1].map((valeur) => ({
      valeur,
      count: initiatives.filter((i) => i.valeurMetier === valeur).length,
    }));
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader title="Analyses du portefeuille" subtitle={`${plan.nom} · domaines, flux et valeur`} />
        <AnalysesDsiClient
          pivot={pivotParDomaine(initiatives)}
          flux={fluxMensuel(initiatives, transitions)}
          valeurs={valeurs}
        />
      </div>
    );
  }

  const initial = await getAnalysesData(plan.id, 'pays', 'axe');

  return (
    <div>
      <PageHeader title="Analyses multi-axes" subtitle="Pivot dynamique, comparaisons et matrice croisée" />
      <AnalysesClient planId={plan.id} initial={initial} />
    </div>
  );
}
