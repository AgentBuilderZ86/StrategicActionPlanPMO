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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-title text-sm font-extrabold">
              PMO
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
                Pilotage stratégique
              </div>
              <h1 className="font-title text-lg font-extrabold leading-tight">
                {plan?.nom ?? 'Plan d’action stratégique'}
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
