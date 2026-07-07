'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type PmoType } from '@/lib/constants';

/** Navigation adaptative : n'affiche que les modules pertinents pour le type
 *  du plan actif (ex. « Agile / SI » n'apparaît que pour un plan SI). */
export function Nav({ typePmo, vertical = false }: { typePmo?: PmoType | null; vertical?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const items = typePmo ? NAV_ITEMS.filter((t) => (t.modules as readonly string[]).includes(typePmo)) : NAV_ITEMS;

  if (vertical) {
    return (
      <nav className="space-y-0.5" aria-label="Navigation principale">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={isActive(t.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              isActive(t.href) ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10',
            )}
          >
            <span aria-hidden className="text-base leading-none">{t.icon}</span>
            {t.label}
          </Link>
        ))}
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
