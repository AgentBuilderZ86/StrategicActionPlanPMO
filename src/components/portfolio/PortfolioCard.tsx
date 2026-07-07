'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PMO_TYPE_LABEL, PMO_TYPE_BADGE, type PmoType } from '@/lib/constants';
import { fmtPct } from '@/lib/utils';
import type { Kpis } from '@/lib/aggregations';

type Plan = { id: string; nom: string; typePmo: string; objectif: string | null };

/** Carte de plan pour la vue portefeuille (P3) — remplace la liste plate par
 *  une vignette riche (type, avancement, alertes) avec bascule en un clic. */
export function PortfolioCard({ plan, kpis }: { plan: Plan; kpis: Kpis }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const type = (plan.typePmo as PmoType) ?? 'INTERNE';
  const style = PMO_TYPE_BADGE[type] ?? PMO_TYPE_BADGE.INTERNE;
  const consoPct = kpis.budgetTotal > 0 ? (kpis.budgetConso / kpis.budgetTotal) * 100 : 0;
  const alertes = kpis.bloquees + kpis.enRetard;

  const ouvrir = async () => {
    setBusy(true);
    await fetch('/api/plan-select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id }),
    }).catch(() => {});
    router.push('/');
    router.refresh();
  };

  return (
    <div className="card flex flex-col gap-3 p-4" style={{ borderTop: `4px solid ${style.fg}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>{style.icon}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: style.bg, color: style.fg }}
          >
            {PMO_TYPE_LABEL[type] ?? type}
          </span>
        </div>
        {alertes > 0 && (
          <span className="rounded-full bg-statut-rouge/10 px-2 py-0.5 text-[11px] font-bold text-statut-rouge">
            {alertes} alerte{alertes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-title text-base font-bold text-ink">{plan.nom}</h3>
        {plan.objectif && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{plan.objectif}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="font-title text-lg font-extrabold text-ink">{kpis.total}</div>
          <div className="text-[10px] uppercase text-slate-400">Actions</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="font-title text-lg font-extrabold text-accent">{fmtPct(kpis.avancementMoyen)}</div>
          <div className="text-[10px] uppercase text-slate-400">Avancement</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="font-title text-lg font-extrabold text-ink">{fmtPct(consoPct)}</div>
          <div className="text-[10px] uppercase text-slate-400">Conso. budget</div>
        </div>
      </div>

      <button onClick={ouvrir} disabled={busy} className="btn-primary mt-1 w-full">
        {busy ? 'Ouverture…' : 'Ouvrir ce plan'}
      </button>
    </div>
  );
}
