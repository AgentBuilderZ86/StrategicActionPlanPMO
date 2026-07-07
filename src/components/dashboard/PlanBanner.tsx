import { PMO_TYPE_LABEL, PMO_TYPE_DESCRIPTION, PMO_TYPE_BADGE, SNSR_OBJECTIF, type PmoType } from '@/lib/constants';
import type { AgileSnapshot } from '@/lib/data';
import { fmtDate, fmtPct } from '@/lib/utils';

type PlanInfo = {
  nom: string;
  typePmo: string;
  objectif: string | null;
  dateDebut: Date | string | null;
  dateFin: Date | string | null;
};

/**
 * Bandeau d'accueil différencié par type de PMO — chaque plan a un contexte
 * et des priorités différentes ; l'accueil doit le refléter au lieu de
 * présenter le même écran générique pour la SNSR, le plan interne et la
 * feuille de route SI.
 */
export function PlanBanner({
  plan,
  avancementMoyen,
  agile,
}: {
  plan: PlanInfo;
  avancementMoyen: number;
  agile?: AgileSnapshot | null;
}) {
  const type = (plan.typePmo as PmoType) ?? 'INTERNE';
  const style = PMO_TYPE_BADGE[type] ?? PMO_TYPE_BADGE.INTERNE;

  return (
    <div className="card mb-5 flex flex-wrap items-center gap-4 p-4" style={{ borderLeft: `4px solid ${style.fg}` }}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
        style={{ backgroundColor: style.bg }}
        aria-hidden
      >
        {style.icon}
      </div>

      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: style.bg, color: style.fg }}
          >
            {PMO_TYPE_LABEL[type] ?? type}
          </span>
          {plan.dateDebut && plan.dateFin && (
            <span className="text-xs text-slate-400">
              {fmtDate(plan.dateDebut)} → {fmtDate(plan.dateFin)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600">{plan.objectif || PMO_TYPE_DESCRIPTION[type]}</p>
      </div>

      {/* Bloc contextuel selon le type de PMO */}
      {type === 'ECOSYSTEME' && (
        <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Objectif SNSR 2030</div>
          <div className="font-title text-lg font-extrabold text-statut-vert">
            -{SNSR_OBJECTIF.reductionCible}% mortalité
          </div>
        </div>
      )}

      {type === 'INTERNE' && (
        <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avancement institutionnel</div>
          <div className="font-title text-lg font-extrabold text-accent">{fmtPct(avancementMoyen)}</div>
        </div>
      )}

      {type === 'SI' && agile?.sprintEnCours && (
        <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Sprint en cours</div>
          <div className="font-title text-sm font-bold text-ink">{agile.sprintEnCours.nom}</div>
          <div className="text-xs text-slate-500">
            {agile.pointsRestants} pt(s) restant(s)
            {agile.derniereVelocity ? ` · vélocité ${agile.derniereVelocity.points} pts` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
