import Link from 'next/link';
import { Nav } from '../Nav';
import { PlanSwitcher } from '../PlanSwitcher';
import { getActivePlan, getPlans } from '@/lib/data';
import { PMO_TYPE_LABEL, type PmoType } from '@/lib/constants';

/** Barre latérale persistante : identité, sélecteur de plan et navigation
 *  adaptative. Remplace l'ancien en-tête horizontal (P4). */
export async function Sidebar() {
  const [plan, plans] = await Promise.all([
    getActivePlan().catch(() => null),
    getPlans().catch(() => []),
  ]);
  const typePmo = (plan?.typePmo as PmoType | undefined) ?? null;

  return (
    <div className="flex h-full flex-col text-white">
      <div className="p-4">
        <Link href="/portefeuille" className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[11px] px-1 font-mono text-[10px] font-bold leading-tight text-sombre-profond" style={{ background: 'linear-gradient(140deg, #2BBB71, #0D8B50)', boxShadow: '0 4px 14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
            <span className="text-[12px] font-black">NARSA</span>
            <span className="text-[7px] font-semibold tracking-wider opacity-80">PMO</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-soft">
              {typePmo ? PMO_TYPE_LABEL[typePmo] : 'Plateforme PMO'}
            </div>
            <div className="text-[11px] text-slate-300">Vue portefeuille ↗</div>
          </div>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <PlanSwitcher
          plans={plans.map((p) => ({ id: p.id, nom: p.nom, typePmo: p.typePmo }))}
          currentId={plan?.id ?? null}
          fallbackTitle={plan?.nom ?? 'Aucun plan'}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        <Nav typePmo={typePmo} vertical />
      </div>

      <div className="border-t border-white/10 p-3 text-[11px] text-slate-400">
        SNSR 2026-2030 · Montants en k MAD
      </div>
    </div>
  );
}
