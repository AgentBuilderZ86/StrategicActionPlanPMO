import Link from 'next/link';
import { Nav } from '../Nav';
import { PlanSwitcher } from '../PlanSwitcher';
import { getActivePlan, getPlans } from '@/lib/data';
import { PMO_TYPE_LABEL, type PmoType } from '@/lib/constants';

/** Barre latérale persistante (maquette) : dégradé radial vert sombre, logo
 *  « NA », sélecteur de plan et navigation adaptative. */
export async function Sidebar() {
  const [plan, plans] = await Promise.all([
    getActivePlan().catch(() => null),
    getPlans().catch(() => []),
  ]);
  const typePmo = (plan?.typePmo as PmoType | undefined) ?? null;

  return (
    <div
      className="flex h-full flex-col px-3.5 py-5 text-white"
      style={{
        background:
          'radial-gradient(120% 140% at 15% 0%, oklch(30% 0.06 155) 0%, oklch(24% 0.045 155) 45%, oklch(20% 0.05 155) 100%)',
        boxShadow: '2px 0 24px rgba(0,0,0,0.18)',
      }}
    >
      <Link href="/portefeuille" className="flex items-center gap-[11px] rounded-lg px-2 pb-6 pt-1 hover:opacity-90">
        <div
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] font-mono text-[13px] font-bold"
          style={{
            background: 'linear-gradient(140deg, oklch(70% 0.16 155), oklch(56% 0.135 155))',
            color: 'oklch(20% 0.05 155)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          NA
        </div>
        <div className="min-w-0">
          <div className="text-[14.5px] font-bold tracking-[0.3px]">
            NARSA <span className="font-medium opacity-55">PMO</span>
          </div>
          <div className="mt-px truncate text-[10px] opacity-55">
            {typePmo ? PMO_TYPE_LABEL[typePmo] : 'Pilotage stratégique'}
          </div>
        </div>
      </Link>

      <div className="pb-3">
        <PlanSwitcher
          plans={plans.map((p) => ({ id: p.id, nom: p.nom, typePmo: p.typePmo }))}
          currentId={plan?.id ?? null}
          fallbackTitle={plan?.nom ?? 'Aucun plan'}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Nav typePmo={typePmo} vertical />
      </div>

      <div className="mt-auto border-t border-white/[0.12] px-2.5 pt-3.5 text-[11px] leading-normal opacity-50">
        Stratégie Nationale
        <br />
        Sécurité Routière 2026-2030
      </div>
    </div>
  );
}
