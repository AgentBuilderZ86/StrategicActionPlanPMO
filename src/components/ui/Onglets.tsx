'use client';

import { cn } from '@/lib/utils';

/** Barre d'onglets pilule (V3) : remplace l'empilement vertical de sections. */
export function Onglets<T extends string>({
  onglets,
  actif,
  onChange,
  className,
}: {
  onglets: { key: T; label: string }[];
  actif: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('onglets', className)} role="tablist">
      {onglets.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={actif === o.key}
          onClick={() => onChange(o.key)}
          className={cn('onglet', actif === o.key && 'onglet-actif')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
