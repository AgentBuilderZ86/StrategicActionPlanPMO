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
import { Tiroir } from '@/components/ui/Tiroir';
import { Onglets } from '@/components/ui/Onglets';

type ActionPlan = { id: string; titre: string; code: string | null; statut: string };

const couleur = (v: number) => (v >= 60 ? '#1A8A51' : v >= 40 ? '#BE7200' : '#D33A3C');

function Jauge({ label, valeur, max = 100 }: { label: string; valeur: number; max?: number }) {
  const pct = Math.round((valeur / max) * 100);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-24 shrink-0 font-medium text-slate-500">{label}</span>
      <div className="h-1.5 grow rounded-full bg-canvas">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: couleur(pct) }} />
      </div>
      <span className="w-9 text-right font-mono text-xs font-bold tabular-nums text-ink">
        {max === 5 ? `${valeur}/5` : valeur}
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
 * Populations V3 : grille compacte de cartes profil ; toute la gestion
 * (profil, pulse, liens aux actions) vit dans un tiroir latéral à onglets —
 * plus rien ne se déplie dans les cartes, la page tient à l'écran.
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
  const [tiroirPour, setTiroirPour] = useState<PopulationDTO | 'nouvelle' | null>(null);
  const [ongletTiroir, setOngletTiroir] = useState<'profil' | 'pulse' | 'liens'>('profil');
  const [form, setForm] = useState<typeof FORM_VIDE>(FORM_VIDE);
  const [pulse, setPulse] = useState({ adhesion: 60, comprehension: 60, preparation: 60, repondants: 8 });
  const [liens, setLiens] = useState<Map<string, string>>(new Map());
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const population = tiroirPour !== 'nouvelle' ? tiroirPour : null;

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

  const ouvrirTiroir = (p: PopulationDTO | 'nouvelle') => {
    setTiroirPour(p);
    setOngletTiroir('profil');
    setInfo(null);
    if (p === 'nouvelle') {
      setForm(FORM_VIDE);
    } else {
      setForm({
        nom: p.nom,
        description: p.description ?? '',
        effectif: p.effectif,
        trancheAge: p.trancheAge,
        ancienneteMoyenne: p.ancienneteMoyenne == null ? '' : String(p.ancienneteMoyenne),
        maturiteDigitale: p.maturiteDigitale,
        expositionChangement: p.expositionChangement,
      });
      setLiens(new Map(p.actions.map((a) => [a.actionId, a.niveauImpact])));
    }
  };

  const enregistrerProfil = async () => {
    const payload = {
      ...(population ? {} : { planId }),
      nom: form.nom,
      description: form.description || null,
      effectif: form.effectif,
      trancheAge: form.trancheAge,
      ancienneteMoyenne: form.ancienneteMoyenne === '' ? null : Number(form.ancienneteMoyenne),
      maturiteDigitale: form.maturiteDigitale,
      expositionChangement: form.expositionChangement,
    };
    const ok = population
      ? await appel(`/api/populations/${population.id}`, 'PATCH', payload)
      : await appel('/api/populations', 'POST', payload);
    if (ok) setTiroirPour(null);
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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/80">
          🔒 Profils agrégés · k-anonymat ≥ 8 · finalité : accompagnement du plan (
          <code className="text-white/60">docs/RGPD_POPULATIONS.md</code>)
        </p>
        {pilotage && (
          <button type="button" className="btn-primary" onClick={() => ouvrirTiroir('nouvelle')}>
            ＋ Nouvelle population
          </button>
        )}
      </div>

      {info && <div className="card px-4 py-2 text-sm text-slate-700">{info}</div>}

      {initial.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          Aucune population référencée. Créez le premier groupe impacté pour activer les signaux
          d&apos;adoption dans le moteur de risque.
        </div>
      ) : (
        <div className="scrolly grid flex-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {initial.map((p) => {
            const charge = chargeActive(p.actions);
            const saturee = estSaturee(p.actions);
            const recept = receptivite(p, p.dernierPulse, charge);
            const recos = pilotage ? recommander(p, p.dernierPulse, p.actions) : [];
            return (
              <div key={p.id} className="card card-liseret p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-ink">{p.nom}</div>
                    <div className="truncate text-[10.5px] text-slate-500">
                      {p.effectif} pers. · {TRANCHE_AGE_LABEL[p.trancheAge as never] ?? p.trancheAge}
                      {p.ancienneteMoyenne != null && ` · anc. ${p.ancienneteMoyenne} ans`}
                    </div>
                  </div>
                  <span
                    className="flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white"
                    style={{ backgroundColor: couleur(recept) }}
                    title="Réceptivité au changement (adhésion, préparation, maturité, charge)"
                  >
                    Récept. {recept}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1">
                  <Jauge label="Maturité dig." valeur={p.maturiteDigitale} max={5} />
                  {p.dernierPulse ? (
                    <>
                      <Jauge label="Adhésion" valeur={p.dernierPulse.adhesion} />
                      <Jauge label="Préparation" valeur={p.dernierPulse.preparation} />
                    </>
                  ) : (
                    <p className="text-[10.5px] italic text-slate-400">Aucun pulse enregistré.</p>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${saturee ? 'bg-red-50 text-statut-rouge' : 'bg-canvas text-slate-600'}`}
                  >
                    {charge} chgt{charge > 1 ? 's' : ''} actif{charge > 1 ? 's' : ''}
                    {saturee && ` · saturation (≥ ${SEUIL_SATURATION})`}
                  </span>
                  {recos.length > 0 && (
                    <span
                      className="cursor-help rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-accent"
                      title={recos.map((r) => r.titre).join(' · ')}
                    >
                      💡 {recos.length} reco{recos.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {pilotage && (
                    <button
                      type="button"
                      className="ml-auto text-[11px] font-bold text-accent hover:underline"
                      onClick={() => ouvrirTiroir(p)}
                    >
                      Gérer →
                    </button>
                  )}
                </div>

                {recos.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-ligne/70 pt-2">
                    {recos.slice(0, 2).map((r) => (
                      <div key={r.code} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600" title={r.justification}>
                          {r.titre}
                        </span>
                        <button
                          type="button"
                          className="flex-none text-[10.5px] font-bold text-accent hover:underline"
                          disabled={chargement}
                          onClick={() => ajouterAuPlan(r.actionSuggeree.titre, r.actionSuggeree.description, r.actionSuggeree.priorite)}
                        >
                          ＋ Plan
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

      {/* Tiroir de gestion : profil / pulse / liens */}
      <Tiroir
        titre={population ? population.nom : 'Nouvelle population'}
        ouvert={tiroirPour !== null}
        onClose={() => setTiroirPour(null)}
      >
        {population && (
          <Onglets
            className="mb-4 w-full [&>button]:flex-1"
            onglets={[
              { key: 'profil', label: 'Profil' },
              { key: 'pulse', label: 'Pulse' },
              { key: 'liens', label: `Actions (${liens.size})` },
            ]}
            actif={ongletTiroir}
            onChange={setOngletTiroir}
          />
        )}

        {info && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-statut-rouge">{info}</div>}

        {(ongletTiroir === 'profil' || !population) && (
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="pop-nom">Nom du groupe</label>
              <input id="pop-nom" className="input" value={form.nom} placeholder="Ex. Agents guichet région Nord"
                onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pop-effectif">Effectif</label>
                <input id="pop-effectif" type="number" min={0} className="input" value={form.effectif}
                  onChange={(e) => setForm({ ...form, effectif: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label" htmlFor="pop-anciennete">Ancienneté moy. (ans)</label>
                <input id="pop-anciennete" type="number" min={0} max={50} className="input" value={form.ancienneteMoyenne}
                  onChange={(e) => setForm({ ...form, ancienneteMoyenne: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="pop-tranche">Tranche d&apos;âge dominante</label>
                <select id="pop-tranche" className="input" value={form.trancheAge}
                  onChange={(e) => setForm({ ...form, trancheAge: e.target.value })}>
                  {TRANCHES_AGE.map((t) => (
                    <option key={t} value={t}>{TRANCHE_AGE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pop-maturite">Maturité digitale (1-5)</label>
                <input id="pop-maturite" type="number" min={1} max={5} className="input" value={form.maturiteDigitale}
                  onChange={(e) => setForm({ ...form, maturiteDigitale: Number(e.target.value) })} />
              </div>
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
            <div>
              <label className="label" htmlFor="pop-desc">Description</label>
              <input id="pop-desc" className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button type="button" className="btn-primary w-full" disabled={!form.nom.trim() || chargement} onClick={enregistrerProfil}>
              {population ? 'Enregistrer le profil' : 'Créer la population'}
            </button>
          </div>
        )}

        {population && ongletTiroir === 'pulse' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Résultats agrégés d&apos;une mini-enquête. Minimum 8 répondants (k-anonymat), jamais de
              réponse individuelle.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['adhesion', 'comprehension', 'preparation', 'repondants'] as const).map((k) => (
                <div key={k}>
                  <label className="label" htmlFor={`pulse-${k}`}>
                    {k === 'repondants' ? 'Répondants (≥ 8)' : k.charAt(0).toUpperCase() + k.slice(1)}
                  </label>
                  <input id={`pulse-${k}`} type="number" className="input"
                    min={k === 'repondants' ? 8 : 0} max={k === 'repondants' ? 100000 : 100}
                    value={pulse[k]}
                    onChange={(e) => setPulse({ ...pulse, [k]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary w-full" disabled={chargement}
              onClick={async () => {
                const ok = await appel(`/api/populations/${population.id}/pulses`, 'POST', pulse);
                if (ok) setTiroirPour(null);
              }}>
              Enregistrer le pulse
            </button>
          </div>
        )}

        {population && ongletTiroir === 'liens' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Actions du plan impactant cette population, avec le niveau d&apos;impact.</p>
            <div className="scrolly max-h-[55vh] rounded-xl bg-canvas p-2.5">
              {actionsPlan.map((a) => {
                const impact = liens.get(a.id);
                return (
                  <div key={a.id} className="flex items-center gap-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      id={`lien-${a.id}`}
                      checked={impact !== undefined}
                      onChange={(e) => {
                        const next = new Map(liens);
                        if (e.target.checked) next.set(a.id, 'INFORME');
                        else next.delete(a.id);
                        setLiens(next);
                      }}
                    />
                    <label htmlFor={`lien-${a.id}`} className="min-w-0 grow truncate">
                      {a.code ? `${a.code} — ` : ''}{a.titre}
                    </label>
                    {impact !== undefined && (
                      <select
                        aria-label="Niveau d'impact"
                        className="input !w-28 !py-0.5 text-xs"
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
            </div>
            <button type="button" className="btn-primary w-full" disabled={chargement}
              onClick={async () => {
                const ok = await appel(`/api/populations/${population.id}/liens`, 'PUT', {
                  liens: [...liens.entries()].map(([actionId, niveauImpact]) => ({ actionId, niveauImpact })),
                });
                if (ok) setTiroirPour(null);
              }}>
              Enregistrer les liens
            </button>
          </div>
        )}
      </Tiroir>
    </div>
  );
}
