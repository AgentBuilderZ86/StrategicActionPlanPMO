'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Tableau de bord' },
  { href: '/actions', label: "Plan d'actions" },
  { href: '/planning', label: 'Planning' },
  { href: '/analyses', label: 'Analyses' },
  { href: '/copil', label: 'Comité de pilotage' },
  { href: '/parametres', label: 'Paramètres' },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="flex flex-wrap gap-1" aria-label="Navigation principale">
      {TABS.map((t) => (
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
