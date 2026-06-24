'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DashboardData } from '@/lib/data';
import { fmtMoney, fmtPct } from '@/lib/utils';
import { KpiCard, SectionCard } from '@/components/ui/Cards';
import { Heatmap } from './Heatmap';
import {
  AvancementParAxe,
  RepartitionStatuts,
  AvancementParPays,
  TendanceAvancement,
  BudgetParAxe,
} from './Charts';
import { PointsAttention } from './PointsAttention';

type Plan = { id: string; nom: string };

export function DashboardClient({
  plans,
  planId,
  axes,
  initial,
}: {
  plans: Plan[];
  planId: string;
  axes: { id: string; nom: string }[];
  initial: DashboardData;
}) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(initial);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const apply = async (nextFrom: string, nextTo: string) => {
    setLoading(true);
    const p = new URLSearchParams({ planId });
    if (nextFrom) p.set('from', nextFrom);
    if (nextTo) p.set('to', nextTo);
    const res = await fetch(`/api/dashboard?${p.toString()}`, { cache: 'no-store' });
    const body = await res.json();
    setData(body);
    setLoading(false);
  };

  const k = data.kpis;
  const consoPct = k.budgetTotal > 0 ? (k.budgetConso / k.budgetTotal) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Filtres globaux */}
      <div className="card flex flex-wrap items-end gap-3 p-3">
        {plans.length > 1 && (
          <div>
            <label className="label" htmlFor="plan">Plan</label>
            <select
              id="plan"
              className="input w-auto"
              value={planId}
              onChange={(e) => router.push(`/?planId=${e.target.value}`)}
            >
              {plans.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="from">Période — du</label>
          <input id="from" type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="to">au</label>
          <input id="to" type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={() => apply(from, to)} className="btn-primary">Appliquer</button>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); apply('', ''); }} className="btn-ghost">Réinitialiser</button>
        )}
        {loading && <span className="text-xs text-slate-400">Actualisation…</span>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Actions" value={k.total} />
        <KpiCard label="Avancement" value={fmtPct(k.avancementMoyen)} accent="#1E4FD8" />
        <KpiCard label="Terminées" value={k.terminees} accent="#1B9E62" />
        <KpiCard label="En cours" value={k.enCours} />
        <KpiCard label="Bloquées" value={k.bloquees} accent="#D64545" />
        <KpiCard label="En retard" value={k.enRetard} accent="#E8A13D" />
        <KpiCard label="Budget" value={fmtMoney(k.budgetTotal)} sub={`Consommé ${fmtPct(consoPct)}`} />
      </div>

      {/* Heatmap */}
      <Heatmap heatmap={data.heatmap} axes={axes} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Avancement par axe" subtitle="Avancement moyen (%) par axe stratégique">
          <AvancementParAxe data={data.parAxe} />
        </SectionCard>
        <SectionCard title="Répartition par statut" subtitle="Nombre d'actions par statut">
          <RepartitionStatuts data={data.statuts} />
        </SectionCard>
        <SectionCard title="Avancement par pays" subtitle="Avancement moyen et volume d'actions par pays">
          <AvancementParPays data={data.parPays} />
        </SectionCard>
        <SectionCard title="Budget par axe" subtitle="Budget alloué vs consommé (k€)">
          <BudgetParAxe data={data.parAxe} />
        </SectionCard>
      </div>

      <SectionCard title="Tendance d'avancement global" subtitle="Évolution mensuelle de l'avancement moyen (snapshots)">
        <TendanceAvancement data={data.trend} />
      </SectionCard>

      <SectionCard title="Points d'attention" subtitle="Actions bloquées ou en retard, triées par priorité">
        <PointsAttention actions={data.attention} />
      </SectionCard>
    </div>
  );
}
