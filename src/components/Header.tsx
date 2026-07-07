import { Nav } from './Nav';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { PlanSwitcher } from './PlanSwitcher';
import { getActivePlan, getPlans } from '@/lib/data';
import { PMO_TYPE_LABEL, PMO_TYPE_DESCRIPTION, type PmoType } from '@/lib/constants';

export async function Header() {
  const [plan, plans] = await Promise.all([
    getActivePlan().catch(() => null),
    getPlans().catch(() => []),
  ]);
  const typePmo = (plan?.typePmo as PmoType | undefined) ?? null;

  return (
    <header className="no-print bg-ink text-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent px-1 font-title text-[10px] font-extrabold leading-tight text-white">
              <span className="text-[13px] font-black">NARSA</span>
              <span className="text-[8px] font-semibold tracking-wider opacity-80">PMO</span>
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-soft"
                title={typePmo ? PMO_TYPE_DESCRIPTION[typePmo] : undefined}
              >
                {typePmo ? PMO_TYPE_LABEL[typePmo] : 'Sécurité Routière · Pilotage stratégique'}
              </div>
              <PlanSwitcher
                plans={plans.map((p) => ({ id: p.id, nom: p.nom, typePmo: p.typePmo }))}
                currentId={plan?.id ?? null}
                fallbackTitle={plan?.nom ?? 'Stratégie Nationale de la Sécurité Routière'}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
        <div className="mt-4">
          <Nav typePmo={typePmo} />
        </div>
      </div>
    </header>
  );
}
