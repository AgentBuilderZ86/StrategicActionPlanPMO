import { Nav } from './Nav';
import { UserMenu } from './UserMenu';
import { getActivePlan } from '@/lib/data';

export async function Header() {
  const plan = await getActivePlan().catch(() => null);

  return (
    <header className="no-print bg-ink text-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-accent px-1 font-title text-[10px] font-extrabold leading-tight text-white">
              <span className="text-[13px] font-black">NARSA</span>
              <span className="text-[8px] font-semibold tracking-wider opacity-80">PMO</span>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
                Sécurité Routière · Pilotage stratégique
              </div>
              <h1 className="font-title text-lg font-extrabold leading-tight">
                {plan?.nom ?? "Stratégie Nationale de la Sécurité Routière"}
              </h1>
            </div>
          </div>
          <UserMenu />
        </div>
        <div className="mt-4">
          <Nav />
        </div>
      </div>
    </header>
  );
}
