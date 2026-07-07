'use client';

import { useEffect, useState } from 'react';
import type { DashboardData } from '@/lib/data';
import { fmtMoney, fmtPct } from '@/lib/utils';
import {
  DASHBOARD_WIDGETS, dashboardConfigParDefaut, type WidgetConfig, type WidgetKey,
} from '@/lib/constants';
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
import { RisquesProactifs } from './RisquesProactifs';
import { InsightsAuto } from './InsightsAuto';

const WIDGET_LABEL: Record<WidgetKey, string> = Object.fromEntries(
  DASHBOARD_WIDGETS.map((w) => [w.key, w.label]),
) as Record<WidgetKey, string>;

export function DashboardClient({
  planId,
  axes,
  initial,
}: {
  planId: string;
  axes: { id: string; nom: string }[];
  initial: DashboardData;
}) {
  const [data, setData] = useState<DashboardData>(initial);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<WidgetConfig[] | null>(null);
  const [perso, setPerso] = useState(false);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  // Préférences de widgets de l'utilisateur (T2.2).
  useEffect(() => {
    fetch('/api/dashboard/config', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (b?.config) setConfig(b.config as WidgetConfig[]); })
      .catch(() => {});
  }, []);

  // Fusion avec les défauts : les widgets ajoutés depuis la sauvegarde des
  // préférences (ex. moteur de risque) apparaissent pour tous les utilisateurs.
  const defauts = dashboardConfigParDefaut();
  const configEffective = config
    ? [
        ...config.filter((w) => defauts.some((d) => d.key === w.key)),
        ...defauts.filter((d) => !config.some((w) => w.key === d.key)),
      ]
    : defauts;

  const enregistrerConfig = async (next: WidgetConfig[]) => {
    setConfig(next);
    await fetch('/api/dashboard/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: next }),
    }).catch(() => {});
  };

  const basculerVisible = (key: WidgetKey) =>
    enregistrerConfig(configEffective.map((w) => (w.key === key ? { ...w, visible: !w.visible } : w)));

  const deplacer = (index: number, sens: -1 | 1) => {
    const next = [...configEffective];
    const cible = index + sens;
    if (cible < 0 || cible >= next.length) return;
    [next[index], next[cible]] = [next[cible]!, next[index]!];
    enregistrerConfig(next);
  };

  const widgetNode = (key: WidgetKey) => {
    switch (key) {
      case 'insights':
        return data.insights.length ? <InsightsAuto insights={data.insights} /> : null;
      case 'risques':
        return <SectionCard title="Alertes proactives" subtitle="Dérives détectées avant le retard — score de risque explicable (vélocité, budget, dormance, blocage, surcharge)"><RisquesProactifs risques={data.risques} /></SectionCard>;
      case 'heatmap':
        return <Heatmap heatmap={data.heatmap} axes={axes} />;
      case 'parAxe':
        return <SectionCard title="Avancement par axe" subtitle="Avancement moyen (%) par axe stratégique"><AvancementParAxe data={data.parAxe} /></SectionCard>;
      case 'statuts':
        return <SectionCard title="Répartition par statut" subtitle="Nombre d'actions par statut"><RepartitionStatuts data={data.statuts} /></SectionCard>;
      case 'parPays':
        return <SectionCard title="Avancement par région" subtitle="Avancement moyen et volume d'actions par région"><AvancementParPays data={data.parPays} /></SectionCard>;
      case 'budget':
        return <SectionCard title="Budget par axe" subtitle="Budget alloué vs consommé (k MAD)"><BudgetParAxe data={data.parAxe} /></SectionCard>;
      case 'tendance':
        return <SectionCard title="Tendance d'avancement global" subtitle="Évolution mensuelle de l'avancement moyen (snapshots)"><TendanceAvancement data={data.trend} /></SectionCard>;
      case 'attention':
        return <SectionCard title="Points d'attention" subtitle="Actions bloquées ou en retard, triées par priorité"><PointsAttention actions={data.attention} /></SectionCard>;
    }
  };

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
      {/* Filtres globaux (le choix du plan se fait désormais dans l'en-tête) */}
      <div className="card flex flex-wrap items-end gap-3 p-3">
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
        <button onClick={() => setPerso((p) => !p)} className="btn-ghost ml-auto text-sm">
          {perso ? 'Terminer' : 'Personnaliser'}
        </button>
      </div>

      {/* Panneau de personnalisation des widgets (T2.2) */}
      {perso && (
        <div className="card p-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">Widgets affichés (ordre &amp; visibilité) — enregistrés pour votre profil</p>
          <ul className="space-y-1">
            {configEffective.map((w, i) => (
              <li key={w.key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                <label className="flex grow items-center gap-2 font-medium text-ink">
                  <input type="checkbox" checked={w.visible} onChange={() => basculerVisible(w.key)} />
                  {WIDGET_LABEL[w.key]}
                </label>
                <button onClick={() => deplacer(i, -1)} disabled={i === 0} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Monter">▲</button>
                <button onClick={() => deplacer(i, 1)} disabled={i === configEffective.length - 1} className="px-1 text-slate-400 disabled:opacity-30" aria-label="Descendre">▼</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPIs (toujours affichés) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Actions" value={k.total} />
        <KpiCard label="Avancement" value={fmtPct(k.avancementMoyen)} accent="#007CB8" />
        <KpiCard label="Terminées" value={k.terminees} accent="#0D8B50" />
        <KpiCard label="En cours" value={k.enCours} />
        <KpiCard label="Bloquées" value={k.bloquees} accent="#D33A3C" />
        <KpiCard label="En retard" value={k.enRetard} accent="#BE7200" />
        <KpiCard label="Budget" value={fmtMoney(k.budgetTotal)} sub={`Consommé ${fmtPct(consoPct)}`} />
      </div>

      {/* Widgets configurables */}
      {configEffective.filter((w) => w.visible).map((w) => (
        <div key={w.key}>{widgetNode(w.key)}</div>
      ))}
    </div>
  );
}
