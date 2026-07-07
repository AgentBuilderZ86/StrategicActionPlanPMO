'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PopulationDTO } from '@/lib/populations-db';
import {
  EXPOSITIONS,
  NIVEAUX_IMPACT,
  NIVEAU_IMPACT_LABEL,
  SEUIL_SATURATION,
  TRANCHES_AGE,
  TRANCHE_AGE_LABEL,
  chargeActive,
  estSaturee,
  receptivite,
  recommander,
} from '@/lib/populations';
import { SectionCard } from '@/components/ui/Cards';

type ActionPlan = { id: string; titre: string; code: string | null; statut: string };

const jauge = (v: number) => (v >= 60 ? '#1B9E62' : v >= 40 ? '#E8A13D' : '#D64545');

function Jauge({ label, valeur, max = 100 }: { label: string; valeur: number; max?: number }) {
  const pct = Math.round((valeur / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-36 shrink-0 font-medium text-slate-500">{label}</span>
      <div className="h-1.5 grow rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: jauge(pct) }} />
      </div>
      <span className="w-12 text-right font-semibold tabular-nums text-ink">
        {max === 5 ? `${valeur}/5` : `${valeur} %`}
      </span>
    </div>
  );
}

const FORM_VIDE = {
  nom: '',
  description: '',
  effectif: 0,
  trancheAge: 'MIXTE',
  ancienneteMoyenne: '',
  maturiteDigitale: 3,
  expositionChangement: 'MOYENNE',
};

/**
 * Référentiel des populations impactées : profils agrégés, pulses, liens aux
 * actions et recommandations d'accompagnement générées par les playbooks.
 */
export function PopulationsClient({
  planId,
  initial,
  actionsPlan,
  pilotage,
  nomUtilisateur,
}: {
  planId: string;
  initial: PopulationDTO[];
  actionsPlan: ActionPlan[];
  pilotage: boolean;
  nomUtilisateur: string;
}) {
  const router = useRouter();
  const [formOuvert, setFormOuvert] = useState(false);
  const [form, setForm] = useState<typeof FORM_VIDE>(FORM_VIDE);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [pulsePour, setPulsePour] = useState<string | null>(null);
  const [pulse, setPulse] = useState({ adhesion: 60, comprehension: 60, preparation: 60, repondants: 8 });
  const [liensPour, setLiensPour] = useState<string | null>(null);
  const [liens, setLiens] = useState<Map<string, string>>(new Map());
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const appel = async (url: string, method: string, body: unknown) => {
    setChargement(true);
    setInfo(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? `Erreur ${res.status}`);
      router.refresh();
      return true;
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Erreur inattendue');
      return false;
    } finally {
      setChargement(false);
    }
  };

  const soumettre = async () => {
    const payload = {
      ...(editionId ? {} : { planId }),
      nom: form.nom,
      description: form.description || null,
      effectif: form.effectif,
      trancheAge: form.trancheAge,
      ancienneteMoyenne: form.ancienneteMoyenne === '' ? null : Number(form.ancienneteMoyenne),
      maturiteDigitale: form.maturiteDigitale,
      expositionChangement: form.expositionChangement,
    };
    const ok = editionId
      ? await appel(`/api/populations/${editionId}`, 'PATCH', payload)
      : await appel('/api/populations', 'POST', payload);
    if (ok) {
      setFormOuvert(false);
      setEditionId(null);
      setForm(FORM_VIDE);
    }
  };

  const editer = (p: PopulationDTO) => {
    setEditionId(p.id);
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      effectif: p.effectif,
      trancheAge: p.trancheAge,
      ancienneteMoyenne: p.ancienneteMoyenne == null ? '' : String(p.ancienneteMoyenne),
      maturiteDigitale: p.maturiteDigitale,
      expositionChangement: p.expositionChangement,
    });
    setFormOuvert(true);
  };

  const ouvrirLiens = (p: PopulationDTO) => {
    setLiensPour(p.id);
    setLiens(new Map(p.actions.map((a) => [a.actionId, a.niveauImpact])));
  };

  const ajouterAuPlan = async (titre: string, description: string, priorite: string) => {
    const ok = await appel('/api/actions', 'POST', {
      planId,
      titre,
      description,
      responsable: nomUtilisateur,
      statut: 'A_LANCER',
      priorite,
      niveau: 4,
    });
    if (ok) setInfo(`Action d'accompagnement « ${titre} » ajoutée au plan.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs text-slate-500">
          🔒 Données agrégées uniquement, aucune donnée individuelle. Pulses restitués à partir de{' '}
          8 répondants (k-anonymat). Finalité : accompagnement du plan. Cadrage détaillé :{' '}
          <code>docs/RGPD_POPULATIONS.md</code>.
        </p>
        {pilotage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditionId(null);
              setForm(FORM_VIDE);
              setFormOuvert(!formOuvert);
            }}
          >
            ＋ Nouvelle population
          </button>
        )}
      </div>

      {info && <div className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700">{info}</div>}

      {formOuvert && (
        <SectionCard title={editionId ? 'Modifier la population' : 'Nouvelle population'}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="pop-nom">Nom du groupe</label>
              <input id="pop-nom" className="input" value={form.nom} placeholder="Ex. Agents guichet région Nord"
                onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pop-effectif">Effectif</label>
              <input id="pop-effectif" type="number" min={0} className="input" value={form.effectif}
                onChange={(e) => setForm({ ...form, effectif: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="pop-tranche">Tranche d’âge dominante</label>
              <select id="pop-tranche" className="input" value={form.trancheAge}
                onChange={(e) => setForm({ ...form, trancheAge: e.target.value })}>
                {TRANCHES_AGE.map((t) => (
                  <option key={t} value={t}>{TRANCHE_AGE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pop-anciennete">Ancienneté moyenne (années)</label>
              <input id="pop-anciennete" type="number" min={0} max={50} className="input" value={form.ancienneteMoyenne}
                onChange={(e) => setForm({ ...form, ancienneteMoyenne: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pop-maturite">Maturité digitale (1-5)</label>
              <input id="pop-maturite" type="number" min={1} max={5} className="input" value={form.maturiteDigitale}
                onChange={(e) => setForm({ ...form, maturiteDigitale: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="pop-expo">Exposition au changement</label>
              <select id="pop-expo" className="input" value={form.expositionChangement}
                onChange={(e) => setForm({ ...form, expositionChangement: e.target.value })}>
                {EXPOSITIONS.map((x) => (
                  <option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="pop-desc">Description</label>
              <input id="pop-desc" className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-primary" disabled={!form.nom.trim() || chargement} onClick={soumettre}>
              {editionId ? 'Enregistrer' : 'Créer'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => { setFormOuvert(false); setEditionId(null); }}>
              Annuler
            </button>
          </div>
        </SectionCard>
      )}

      {initial.length === 0 && !formOuvert ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          Aucune population référencée. Créez le premier groupe de collaborateurs impacté pour
          activer les signaux d’adoption dans le moteur de risque.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {initial.map((p) => {
            const charge = chargeActive(p.actions);
            const saturee = estSaturee(p.actions);
            const recept = receptivite(p, p.dernierPulse, charge);
            const recos = pilotage ? recommander(p, p.dernierPulse, p.actions) : [];
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-title text-sm font-bold text-ink">{p.nom}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.effectif} pers. · {TRANCHE_AGE_LABEL[p.trancheAge as never] ?? p.trancheAge}
                      {p.ancienneteMoyenne != null && ` · anc. moy. ${p.ancienneteMoyenne} ans`}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: jauge(recept) }}
                    title="Réceptivité au changement (adhésion, préparation, maturité, charge)"
                  >
                    Réceptivité {recept}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <Jauge label="Maturité digitale" valeur={p.maturiteDigitale} max={5} />
                  {p.dernierPulse ? (
                    <>
                      <Jauge label="Adhésion (dernier pulse)" valeur={p.dernierPulse.adhesion} />
                      <Jauge label="Compréhension" valeur={p.dernierPulse.comprehension} />
                      <Jauge label="Préparation" valeur={p.dernierPulse.preparation} />
                    </>
                  ) : (
                    <p className="text-xs italic text-slate-400">Aucun pulse enregistré.</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-36 shrink-0 font-medium text-slate-500">Charge de changement</span>
                    <span className={saturee ? 'font-bold text-statut-rouge' : 'font-semibold text-ink'}>
                      {charge} action{charge > 1 ? 's' : ''} active{charge > 1 ? 's' : ''}
                      {saturee && ` — saturation (seuil ${SEUIL_SATURATION})`}
                    </span>
                  </div>
                </div>

                {pilotage && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => editer(p)}>Modifier</button>
                    <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs"
                      onClick={() => { setPulsePour(pulsePour === p.id ? null : p.id); }}>
                      ＋ Pulse
                    </button>
                    <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => ouvrirLiens(p)}>
                      Actions liées ({p.actions.length})
                    </button>
                  </div>
                )}

                {pulsePour === p.id && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(['adhesion', 'comprehension', 'preparation', 'repondants'] as const).map((k) => (
                        <div key={k}>
                          <label className="label" htmlFor={`pulse-${p.id}-${k}`}>
                            {k === 'repondants' ? 'Répondants (≥ 8)' : k.charAt(0).toUpperCase() + k.slice(1)}
                          </label>
                          <input id={`pulse-${p.id}-${k}`} type="number" className="input"
                            min={k === 'repondants' ? 8 : 0} max={k === 'repondants' ? 100000 : 100}
                            value={pulse[k]}
                            onChange={(e) => setPulse({ ...pulse, [k]: Number(e.target.value) })} />
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn-primary mt-2 !px-3 !py-1.5 text-xs" disabled={chargement}
                      onClick={async () => {
                        const ok = await appel(`/api/populations/${p.id}/pulses`, 'POST', pulse);
                        if (ok) setPulsePour(null);
                      }}>
                      Enregistrer le pulse
                    </button>
                  </div>
                )}

                {liensPour === p.id && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-slate-50 p-3">
                    {actionsPlan.map((a) => {
                      const impact = liens.get(a.id);
                      return (
                        <div key={a.id} className="flex items-center gap-2 py-1 text-xs">
                          <input
                            type="checkbox"
                            id={`lien-${p.id}-${a.id}`}
                            checked={impact !== undefined}
                            onChange={(e) => {
                              const next = new Map(liens);
                              if (e.target.checked) next.set(a.id, 'INFORME');
                              else next.delete(a.id);
                              setLiens(next);
                            }}
                          />
                          <label htmlFor={`lien-${p.id}-${a.id}`} className="grow truncate">
                            {a.code ? `${a.code} — ` : ''}{a.titre}
                          </label>
                          {impact !== undefined && (
                            <select
                              aria-label="Niveau d'impact"
                              className="input !w-32 !py-1 text-xs"
                              value={impact}
                              onChange={(e) => setLiens(new Map(liens).set(a.id, e.target.value))}
                            >
                              {NIVEAUX_IMPACT.map((n) => (
                                <option key={n} value={n}>{NIVEAU_IMPACT_LABEL[n]}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                    <button type="button" className="btn-primary mt-2 !px-3 !py-1.5 text-xs" disabled={chargement}
                      onClick={async () => {
                        const ok = await appel(`/api/populations/${p.id}/liens`, 'PUT', {
                          liens: [...liens.entries()].map(([actionId, niveauImpact]) => ({ actionId, niveauImpact })),
                        });
                        if (ok) setLiensPour(null);
                      }}>
                      Enregistrer les liens
                    </button>
                  </div>
                )}

                {recos.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Recommandations d’accompagnement
                    </div>
                    {recos.map((r) => (
                      <div key={r.code} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                        <div className="text-xs font-bold text-ink">{r.titre}</div>
                        <p className="mt-0.5 text-xs text-slate-600">{r.justification}</p>
                        <button
                          type="button"
                          className="btn-primary mt-2 !px-3 !py-1 text-xs"
                          disabled={chargement}
                          onClick={() => ajouterAuPlan(r.actionSuggeree.titre, r.actionSuggeree.description, r.actionSuggeree.priorite)}
                        >
                          ＋ Ajouter au plan
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
