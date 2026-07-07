'use client';

import { useState } from 'react';
import type { ActionDTO } from '@/lib/serialize';
import { StatutBadge } from '@/components/ui/Badges';
import { fmtDate } from '@/lib/utils';

type Reponse = {
  avancement: number;
  confiance: number | null;
  bloque: boolean;
  commentaire: string;
};

/**
 * Check-in hebdomadaire guidé : les actions défilent une par une, façon
 * « stories ». Quatre gestes par action — avancement, confiance, blocage,
 * commentaire — puis enregistrement immédiat (PATCH). C'est le rituel qui
 * garantit la fraîcheur des données, donc la fiabilité du moteur de risque.
 */
export function CheckinDialog({
  actions,
  onClose,
}: {
  actions: ActionDTO[];
  onClose: (misesAJour: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [misesAJour, setMisesAJour] = useState(0);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponse, setReponse] = useState<Reponse>(() => initReponse(actions[0]));

  const action = actions[index];
  const termine = index >= actions.length;

  function initReponse(a: ActionDTO | undefined): Reponse {
    return {
      avancement: a?.avancement ?? 0,
      confiance: a?.confiance ?? null,
      bloque: a?.statut === 'BLOQUE',
      commentaire: '',
    };
  }

  const passer = () => avancer(false);

  const enregistrer = async () => {
    if (!action) return;
    setEnregistrement(true);
    setErreur(null);
    const patch: Record<string, unknown> = {};
    if (reponse.avancement !== action.avancement) patch.avancement = reponse.avancement;
    if (reponse.confiance !== null && reponse.confiance !== action.confiance)
      patch.confiance = reponse.confiance;
    if (reponse.bloque && action.statut !== 'BLOQUE') patch.statut = 'BLOQUE';
    if (!reponse.bloque && action.statut === 'BLOQUE') patch.statut = 'EN_COURS';
    if (!reponse.bloque && reponse.avancement === 100 && action.statut !== 'TERMINE')
      patch.statut = 'TERMINE';
    if (reponse.commentaire.trim()) patch.commentaire = reponse.commentaire.trim();

    try {
      if (Object.keys(patch).length > 0) {
        const res = await fetch(`/api/actions/${action.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? `Erreur ${res.status}`);
        }
        setMisesAJour((n) => n + 1);
      }
      avancer(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setEnregistrement(false);
    }
  };

  const avancer = (_ok: boolean) => {
    const suivant = index + 1;
    setIndex(suivant);
    setReponse(initReponse(actions[suivant]));
    setErreur(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Check-in hebdomadaire"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(misesAJour);
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Barre de progression du rituel */}
        <div className="mb-4 flex items-center gap-2">
          {actions.map((a, i) => (
            <div
              key={a.id}
              className={`h-1.5 grow rounded-full ${i < index ? 'bg-accent' : i === index ? 'bg-accent/50' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {termine ? (
          <div className="py-8 text-center">
            <div className="text-3xl">✅</div>
            <h3 className="mt-2 font-title text-lg font-bold text-ink">Check-in terminé</h3>
            <p className="mt-1 text-sm text-slate-500">
              {misesAJour} action{misesAJour > 1 ? 's' : ''} mise{misesAJour > 1 ? 's' : ''} à jour.
              Le moteur de risque intègre vos signaux dès maintenant.
            </p>
            <button type="button" className="btn-primary mt-5" onClick={() => onClose(misesAJour)}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Action {index + 1} / {actions.length}
            </div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-title text-base font-bold text-ink">{action!.titre}</h3>
              <StatutBadge statut={action!.statut} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {[action!.axe, action!.pays, `échéance ${fmtDate(action!.dateFin)}`]
                .filter(Boolean)
                .join(' · ')}
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="checkin-avancement" className="label mb-0">
                    Avancement
                  </label>
                  <span className="text-sm font-bold tabular-nums text-ink">
                    {reponse.avancement} %
                  </span>
                </div>
                <input
                  id="checkin-avancement"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={reponse.avancement}
                  onChange={(e) => setReponse({ ...reponse, avancement: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <span className="label">Confiance sur la tenue de l&apos;échéance</span>
                <div className="flex gap-2" role="radiogroup" aria-label="Confiance de 1 à 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={reponse.confiance === n}
                      onClick={() => setReponse({ ...reponse, confiance: n })}
                      className={`h-9 w-9 rounded-lg border text-sm font-bold transition-colors ${
                        reponse.confiance === n
                          ? n <= 2
                            ? 'border-statut-rouge bg-statut-rouge text-white'
                            : n === 3
                              ? 'border-statut-ambre bg-statut-ambre text-white'
                              : 'border-statut-vert bg-statut-vert text-white'
                          : 'border-slate-300 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={reponse.bloque}
                  onChange={(e) => setReponse({ ...reponse, bloque: e.target.checked })}
                  className="h-4 w-4 accent-statut-rouge"
                />
                Je suis bloqué sur cette action
              </label>

              <div>
                <label htmlFor="checkin-commentaire" className="label">
                  Commentaire {reponse.bloque ? '(décrivez le blocage)' : '(facultatif)'}
                </label>
                <textarea
                  id="checkin-commentaire"
                  rows={2}
                  className="input"
                  placeholder={reponse.bloque ? 'Nature du blocage, aide attendue…' : 'Fait marquant, point d’attention…'}
                  value={reponse.commentaire}
                  onChange={(e) => setReponse({ ...reponse, commentaire: e.target.value })}
                />
              </div>
            </div>

            {erreur && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-statut-rouge">
                {erreur}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                onClick={() => onClose(misesAJour)}
              >
                Reprendre plus tard
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={passer} disabled={enregistrement}>
                  Passer
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={enregistrer}
                  disabled={enregistrement}
                >
                  {enregistrement ? 'Enregistrement…' : 'Valider et suivant'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
