import { PageHeader } from '@/components/PageHeader';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { getPortfolio } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PortefeuillePage() {
  const portfolio = await getPortfolio();

  if (portfolio.length === 0) {
    return (
      <div>
        <PageHeader title="Portefeuille de plans" />
        <div className="card p-8 text-sm text-slate-500">Aucun plan. Lancez le seed : <code>pnpm db:seed</code>.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Portefeuille de plans"
        subtitle="Vue d'ensemble de tous les plans pilotés par la NARSA — ouvrez-en un pour y entrer"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {portfolio.map(({ plan, kpis }) => (
          <PortfolioCard key={plan.id} plan={plan} kpis={kpis} />
        ))}
      </div>
    </div>
  );
}
