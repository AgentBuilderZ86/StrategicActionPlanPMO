import { PMO_TYPE_LABEL, PMO_TYPE_DESCRIPTION, SNSR_OBJECTIF, type PmoType } from '@/lib/constants';
import type { AgileSnapshot } from '@/lib/data';
import type { Kpis } from '@/lib/aggregations';
import { fmtPct } from '@/lib/utils';

type PlanInfo = {
  nom: string;
  typePmo: string;
  objectif: string | null;
  dateDebut: Date | string | null;
  dateFin: Date | string | null;
};

const RAYON = 42;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

/**
 * Hero du tableau de bord (maquette) : carte dégradé vert sombre avec anneau
 * d'avancement global, stats clés en mono, exécution budgétaire, puis bande
 * d'état (« plan sous contrôle » ou alerte). Différencié par type de PMO
 * (objectif SNSR / avancement institutionnel / sprint agile en cours).
 */
export function PlanBanner({
  plan,
  kpis,
  agile,
}: {
  plan: PlanInfo;
  kpis: Kpis;
  agile?: AgileSnapshot | null;
}) {
  const type = (plan.typePmo as PmoType) ?? 'INTERNE';
  const avancement = Math.max(0, Math.min(100, kpis.avancementMoyen));
  const offset = CIRCONFERENCE * (1 - avancement / 100);
  const consoPct = kpis.budgetTotal > 0 ? Math.round((kpis.budgetConso / kpis.budgetTotal) * 100) : 0;
  const alertes = kpis.bloquees + kpis.enRetard;

  return (
    <div className="mb-5 animate-fade-in-up">
      <div
        className="relative mb-4 overflow-hidden rounded-[18px] px-7 pb-[22px] pt-6 text-white"
        style={{
          background:
            'linear-gradient(120deg, oklch(20% 0.05 155) 0%, oklch(24% 0.045 155) 55%, oklch(28% 0.055 155) 100%)',
          boxShadow: '0 20px 40px -20px rgba(10,30,22,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(480px 200px at 85% -20%, oklch(60% 0.1 155 / 0.35), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center gap-6">
          <svg width="92" height="92" viewBox="0 0 104 104" className="shrink-0" role="img" aria-label={`Avancement global ${avancement} %`}>
            <circle cx="52" cy="52" r={RAYON} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
            <circle
              cx="52"
              cy="52"
              r={RAYON}
              fill="none"
              stroke="oklch(78% 0.15 155)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCONFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 52 52)"
            />
            <text x="52" y="58" textAnchor="middle" className="num" fontSize="22" fontWeight="600" fill="white">
              {avancement}%
            </text>
          </svg>

          <div className="min-w-[150px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.6px]" style={{ color: 'oklch(78% 0.15 155)' }}>
              Avancement global
            </div>
            <div className="mt-1 text-[13px] text-white/75">{plan.nom}</div>
            <div className="mt-1 max-w-md text-xs text-white/50">{plan.objectif || PMO_TYPE_DESCRIPTION[type]}</div>
          </div>

          <div className="ml-auto flex gap-7">
            <div>
              <div className="num text-2xl font-semibold text-white">{kpis.total}</div>
              <div className="mt-0.5 text-[11px] text-white/60">Actions</div>
            </div>
            <div>
              <div className="num text-2xl font-semibold" style={{ color: 'oklch(78% 0.15 155)' }}>
                {kpis.terminees}
              </div>
              <div className="mt-0.5 text-[11px] text-white/60">Terminées</div>
            </div>
            <div>
              <div className="num text-2xl font-semibold" style={{ color: 'oklch(75% 0.12 240)' }}>
                {kpis.enCours}
              </div>
              <div className="mt-0.5 text-[11px] text-white/60">En cours</div>
            </div>
            {type === 'ECOSYSTEME' && (
              <div className="hidden border-l border-white/10 pl-7 sm:block">
                <div className="num text-2xl font-semibold" style={{ color: 'oklch(78% 0.15 155)' }}>
                  -{SNSR_OBJECTIF.reductionCible}%
                </div>
                <div className="mt-0.5 text-[11px] text-white/60">Objectif mortalité 2030</div>
              </div>
            )}
            {type === 'SI' && agile?.sprintEnCours && (
              <div className="hidden border-l border-white/10 pl-7 sm:block">
                <div className="text-sm font-bold text-white">{agile.sprintEnCours.nom}</div>
                <div className="mt-0.5 text-[11px] text-white/60">
                  {agile.pointsRestants} pt(s) restant(s)
                  {agile.derniereVelocity ? ` · vélocité ${agile.derniereVelocity.points}` : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {kpis.budgetTotal > 0 && (
          <div className="relative mt-5 flex items-center gap-4 border-t border-white/[0.12] pt-[18px]">
            <div className="num whitespace-nowrap text-base font-semibold text-white">
              {kpis.budgetTotal.toLocaleString('fr-FR')} k MAD
            </div>
            <div className="h-[7px] flex-1 overflow-hidden rounded bg-white/[0.14]">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(100, consoPct)}%`,
                  background: 'linear-gradient(90deg, oklch(78% 0.15 155), oklch(65% 0.15 90))',
                }}
              />
            </div>
            <div className="whitespace-nowrap text-[11.5px] text-white/65">{fmtPct(consoPct)} consommé</div>
          </div>
        )}
      </div>

      {alertes === 0 ? (
        <div
          className="flex items-center gap-2.5 rounded-xl border px-[18px] py-3 text-[12.5px] font-medium"
          style={{
            background: 'var(--success-bg)',
            borderColor: 'oklch(85% 0.06 155)',
            color: 'oklch(32% 0.08 155)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M8.5 12.3l2.4 2.4 4.6-5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <strong>{kpis.bloquees}</strong> action bloquée · <strong>{kpis.enRetard}</strong> action en retard — plan sous contrôle
          </span>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 rounded-xl border px-[18px] py-3 text-[12.5px] font-medium"
          style={{
            background: 'var(--warning-bg)',
            borderColor: 'oklch(80% 0.08 75)',
            color: 'oklch(38% 0.1 70)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
            <path d="M12 3l9 16H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
          </svg>
          <span>
            <strong>{kpis.bloquees}</strong> action(s) bloquée(s) · <strong>{kpis.enRetard}</strong> en retard — voir les points d&apos;attention
          </span>
        </div>
      )}
    </div>
  );
}
