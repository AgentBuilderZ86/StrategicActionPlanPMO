import { BAROMETRE_2024, DISCLAIMER_IMPACT, type EnjeuCumule } from '@/lib/impact-sr';

const fmt = (n: number) => n.toLocaleString('fr-FR');

/**
 * Tuile « Impact sécurité routière » : rappelle le coût humain national
 * (Baromètre 2024) et le potentiel des leviers auxquels les actions actives
 * du plan se rattachent — pour inciter à résoudre, sans sur-promettre.
 */
export function ImpactSR({ enjeu }: { enjeu: EnjeuCumule }) {
  const b = BAROMETRE_2024;
  return (
    <div className="tuile tuile-sombre">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Impact sécurité routière — Maroc {b.annee}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span>
              <span className="font-mono text-2xl font-bold tabular-nums">{fmt(b.tues)}</span>
              <span className="ml-1.5 text-xs text-white/75">tués ({b.evolutionTues})</span>
            </span>
            <span>
              <span className="font-mono text-2xl font-bold tabular-nums">{fmt(b.blessesGraves)}</span>
              <span className="ml-1.5 text-xs text-white/75">blessés graves ({b.evolutionBG})</span>
            </span>
            <span>
              <span className="font-mono text-2xl font-bold tabular-nums">{b.partUsagersVulnerables} %</span>
              <span className="ml-1.5 text-xs text-white/75">des tués sont des usagers vulnérables</span>
            </span>
          </div>
        </div>
        {enjeu.leviers.length > 0 && (
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Potentiel des leviers portés par le plan
            </div>
            <div className="mt-1 font-mono text-xl font-bold tabular-nums">
              {fmt(enjeu.viesMin)} – {fmt(enjeu.viesMax)}
              <span className="ml-1.5 font-sans text-xs font-semibold text-white/80">vies/an</span>
            </div>
            <div className="text-[11px] text-white/70">
              {enjeu.leviers.length} levier{enjeu.leviers.length > 1 ? 's' : ''} ·{' '}
              {enjeu.actionsCouvertes} action{enjeu.actionsCouvertes > 1 ? 's' : ''} active
              {enjeu.actionsCouvertes > 1 ? 's' : ''} rattachée{enjeu.actionsCouvertes > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 max-w-4xl text-[10.5px] leading-relaxed text-white/55">{DISCLAIMER_IMPACT}</p>
    </div>
  );
}
