import type { LevierSR } from '@/lib/impact-sr';

/**
 * Badge d'enjeu humain : rattache une action à son levier national de
 * sécurité routière. Le détail (fondement + référence) est dans le title.
 */
export function EnjeuVies({ levier }: { levier: LevierSR }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-red-700 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm"
      title={`${levier.libelle} — ${levier.fondement} (${levier.reference}). Fourchette indicative du levier national, pas une prévision d'impact de l'action.`}
    >
      ❤ {levier.viesMin}–{levier.viesMax} vies/an
    </span>
  );
}
