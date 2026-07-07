'use client';

import { useEffect } from 'react';

/**
 * Tiroir latéral droit en verre dépoli (V3) : accueille les formulaires et
 * détails qui gonflaient les cartes (édition population, pulse, liens…).
 */
export function Tiroir({
  titre,
  ouvert,
  onClose,
  children,
}: {
  titre: string;
  ouvert: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onClose]);

  if (!ouvert) return null;

  return (
    <>
      <button
        aria-label="Fermer le panneau"
        className="fixed inset-0 z-40 bg-sombre/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto bg-white/90 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-title text-base font-bold text-ink">{titre}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
