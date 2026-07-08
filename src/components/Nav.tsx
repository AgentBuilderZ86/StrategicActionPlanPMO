'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type PmoType } from '@/lib/constants';
import { NavIcon, type NavIconId } from '@/components/shell/NavIcon';

/** Navigation adaptative : n'affiche que les modules pertinents pour le type
 *  du plan actif (ex. « Agile / SI » n'apparaît que pour un plan SI). */
export function Nav({ typePmo, vertical = false }: { typePmo?: PmoType | null; vertical?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const items = typePmo ? NAV_ITEMS.filter((t) => (t.modules as readonly string[]).includes(typePmo)) : NAV_ITEMS;

  if (vertical) {
    return (
      <nav className="flex flex-col gap-[3px]" aria-label="Navigation principale">
        {items.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-[11px] rounded-[10px] px-3 py-[10.5px] text-[13px] transition-colors',
                active
                  ? 'bg-gradient-to-r from-white/[0.16] to-white/[0.06] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                  : 'font-medium text-white/[0.68] hover:bg-white/[0.08] hover:text-white',
              )}
            >
              <NavIcon
                id={t.icon as NavIconId}
                className={cn('shrink-0 transition-colors', active ? 'text-[oklch(78%_0.14_155)]' : 'text-white/55')}
              />
              {t.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap gap-1" aria-label="Navigation principale">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={isActive(t.href) ? 'page' : undefined}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isActive(t.href)
              ? 'bg-white text-ink'
              : 'bg-white/5 text-slate-300 hover:bg-white/10',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
