'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MaJourneeData } from '@/lib/data';
import type { Role } from '@/lib/constants';
import { KpiCard, SectionCard } from '@/components/ui/Cards';
import { StatutBadge, RetardBadge } from '@/components/ui/Badges';
import { RisquesProactifs } from '@/components/dashboard/RisquesProactifs';
import { CheckinDialog } from './CheckinDialog';
import { fmtDate, fmtPct } from '@/lib/utils';

/**
 * Cockpit personnel : chaque bloc répond à « que dois-je faire maintenant ? ».
 * Contributeur : ses actions, ses échéances, son check-in.
 * PMO/ADMIN : en plus, les risques du plan et les validations en attente.
 */
export function MaJourneeClient({
  data,
  role,
  peutSaisir,
}: {
  data: MaJourneeData;
  role: Role;
  peutSaisir: boolean;
}) {
  const router = useRouter();
  const [checkinOuvert, setCheckinOuvert] = useState(false);
  const pilotage = role === 'ADMIN' || role === 'PMO';
  const aFaire = useMemo(() => data.mesEcheances.slice(0, 6), [data.mesEcheances]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Mes actions actives" value={data.mesActions.length} />
        <KpiCard
          label="Échéances sous 14 jours"
          value={data.mesEcheances.length}
          accent={data.mesEcheances.length > 0 ? '#BE7200' : undefined}
        />
        <KpiCard
          label="Mes retards"
          value={data.mesRetards}
          accent={data.mesRetards > 0 ? '#D33A3C' : '#0D8B50'}
        />
        {pilotage ? (
          <KpiCard
            label="Validations en attente"
            value={data.validationsEnAttente}
            accent={data.validationsEnAttente > 0 ? '#007CB8' : undefined}
          />
        ) : (
          <KpiCard label="File de check-in" value={data.fileCheckin.length} />
        )}
      </div>

      {peutSaisir && data.fileCheckin.length > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 to-sky-50 p-4">
          <div>
            <div className="font-title text-sm font-bold text-ink">Check-in hebdomadaire</div>
            <p className="mt-0.5 text-xs text-slate-500">
              {data.fileCheckin.length} action{data.fileCheckin.length > 1 ? 's' : ''} à passer en
              revue — avancement, confiance, blocage. Moins de 2 minutes.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setCheckinOuvert(true)}>
            ▶ Lancer le check-in
          </button>
        </div>
      )}

      <div className={pilotage ? 'grid gap-4 lg:grid-cols-2' : ''}>
        <SectionCard
          title="Mes prochaines échéances"
          subtitle="Actions à traiter sous 14 jours, retards inclus"
        >
          {aFaire.length === 0 ? (
            <div className="py-6 text-center text-sm text-statut-vert">
              ✓ Aucune échéance imminente sur votre périmètre.
            </div>
          ) : (
            <div className="scrolly max-h-[38vh] space-y-2">
              {aFaire.map((a) => (
                <Link
                  key={a.id}
                  href={`/actions?focus=${a.id}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0 grow">
                    <div className="truncate text-sm font-semibold text-ink">{a.titre}</div>
                    <div className="text-xs text-slate-500">
                      {[a.axe, a.pays, a.responsable].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {a.enRetard && <RetardBadge />}
                  <StatutBadge statut={a.statut} />
                  <div className="w-14 text-right text-xs font-semibold tabular-nums">
                    {fmtPct(a.avancement)}
                  </div>
                  <div className="w-20 text-right text-xs text-slate-500">{fmtDate(a.dateFin)}</div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {pilotage && (
          <SectionCard
            title="Risques du plan"
            subtitle="Top dérives détectées par le moteur de risque"
            right={
              <Link href="/" className="text-xs font-semibold text-accent hover:underline">
                Tableau de bord →
              </Link>
            }
          >
            <div className="scrolly max-h-[38vh]"><RisquesProactifs risques={data.risquesPlan} /></div>
          </SectionCard>
        )}
      </div>

      {checkinOuvert && (
        <CheckinDialog
          actions={data.fileCheckin}
          onClose={(misesAJour) => {
            setCheckinOuvert(false);
            if (misesAJour > 0) router.refresh();
          }}
        />
      )}
    </div>
  );
}
