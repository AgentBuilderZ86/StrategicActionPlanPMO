'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DomaineDTO, InitiativeDTO } from '@/lib/ppm-db';
import {
  champsRequisPour,
  cyclePourMode,
  labelStatut,
  transitionsPossibles,
  type ModeDelivery,
} from '@/lib/ppm';
import { Onglets } from '@/components/ui/Onglets';
import { Tiroir } from '@/components/ui/Tiroir';
import { fmtDate } from '@/lib/utils';

const FORM_VIDE = {
  titre: '',
  description: '',
  type: 'INITIATIVE',
  mode: 'WATERFALL',
  domaineId: '',
  sousDomaineId: '',
  valeurMetier: 3,
  chefProjet: '',
  chefProjetExterne: '',
  productOwner: '',
  proxyPo: '',
  keyUsers: '',
  equipeMep: '',
};

/**
 * Pipeline PPM DSI : kanban par statut de cycle (Waterfall ou Agile), fiche
 * initiative en tiroir avec rôles, transitions contrôlées (champs d'étape
 * exigés) et timeline des transitions. DSI et métiers interagissent ici.
 */
export function PipelineClient({
  planId,
  initial,
  domaines,
  peutSaisir,
  focusId,
}: {
  planId: string;
  initial: InitiativeDTO[];
  domaines: DomaineDTO[];
  peutSaisir: boolean;
  focusId: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ModeDelivery>('WATERFALL');
  const [domaineFiltre, setDomaineFiltre] = useState<string>('tous');
  const [ouverte, setOuverte] = useState<InitiativeDTO | null>(
    focusId ? (initial.find((i) => i.id === focusId) ?? null) : null,
  );
  const [creation, setCreation] = useState(false);
  const [form, setForm] = useState<typeof FORM_VIDE>(FORM_VIDE);
  const [champsEtape, setChampsEtape] = useState<Record<string, string>>({});
  const [transitionVers, setTransitionVers] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const compteurs = useMemo(() => {
    const c = new Map<string, number>();
    for (const i of initial) c.set(i.mode, (c.get(i.mode) ?? 0) + 1);
    return c;
  }, [initial]);

  const visibles = initial.filter(
    (i) => i.mode === mode && (domaineFiltre === 'tous' || i.domaineId === domaineFiltre),
  );
  const colonnes = cyclePourMode(mode).filter(
    (e) => e.statut !== 'NOGO' || visibles.some((i) => i.statutCycle === 'NOGO'),
  );

  const appel = async (url: string, method: string, body: unknown): Promise<Record<string, unknown> | null> => {
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
      return data as Record<string, unknown>;
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Erreur inattendue');
      return null;
    } finally {
      setChargement(false);
    }
  };

  const soumettre = async () => {
    const data = await appel('/api/initiatives', 'POST', {
      planId,
      ...form,
      description: form.description || null,
      domaineId: form.domaineId || null,
      sousDomaineId: form.sousDomaineId || null,
    });
    if (data) {
      setCreation(false);
      setForm(FORM_VIDE);
      setInfo('Initiative soumise — elle arrive en début de cycle, la DSI est notifiée.');
    }
  };

  const lancerTransition = async (vers: string) => {
    if (!ouverte) return;
    const requis = champsRequisPour(vers);
    const manquant = requis.find(
      (r) => !(champsEtape[r.champ] ?? (ouverte as unknown as Record<string, string | null>)[r.champ]),
    );
    if (manquant && transitionVers !== vers) {
      setTransitionVers(vers); // afficher les champs d'étape avant de confirmer
      return;
    }
    const data = await appel(`/api/initiatives/${ouverte.id}/transition`, 'POST', {
      vers,
      commentaire: champsEtape.commentaire || null,
      lot: champsEtape.lot || null,
      motifGoNoGo: champsEtape.motifGoNoGo || null,
      reservesRecette: champsEtape.reservesRecette || null,
    });
    if (data) {
      const resultat = data as { data?: { initiative?: InitiativeDTO; notifies?: string[] } };
      const maj = resultat.data?.initiative;
      const notifies = resultat.data?.notifies ?? [];
      if (maj) setOuverte(maj);
      setTransitionVers(null);
      setChampsEtape({});
      setInfo(
        `→ ${labelStatut(mode, vers)}.` +
          (notifies.length ? ` ✉ Notifiés : ${notifies.join(', ')}.` : ''),
      );
    }
  };

  const sousDomainesDuForm = domaines.find((d) => d.id === form.domaineId)?.sousDomaines ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Onglets
          onglets={[
            { key: 'WATERFALL', label: `Waterfall (${compteurs.get('WATERFALL') ?? 0})` },
            { key: 'AGILE', label: `Agile (${compteurs.get('AGILE') ?? 0})` },
          ]}
          actif={mode}
          onChange={(m) => setMode(m)}
        />
        <select
          aria-label="Filtrer par domaine"
          className="input !w-auto !py-1.5 text-xs"
          value={domaineFiltre}
          onChange={(e) => setDomaineFiltre(e.target.value)}
        >
          <option value="tous">Tous les domaines</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>{d.nom}</option>
          ))}
        </select>
        {peutSaisir && (
          <button type="button" className="btn-primary ml-auto" onClick={() => setCreation(true)}>
            ＋ Soumettre une initiative
          </button>
        )}
      </div>

      {info && <div className="card px-4 py-2 text-xs text-slate-700">{info}</div>}

      {/* Kanban horizontal */}
      <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto pb-2">
        {colonnes.map((col) => {
          const cartes = visibles.filter((i) => i.statutCycle === col.statut);
          return (
            <div
              key={col.statut}
              className="flex w-[215px] min-w-[215px] flex-col rounded-xl bg-white/50 p-2 backdrop-blur"
            >
              <div className="flex items-center gap-1.5 px-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span className="rounded bg-accent px-1.5 py-px text-[9px] text-white">{col.phase}</span>
                <span className="truncate">{col.label}</span>
                <span className="ml-auto rounded-full bg-white px-1.5 font-mono text-[10px] text-ink">
                  {cartes.length}
                </span>
              </div>
              <div className="scrolly flex-1">
                {cartes.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      setOuverte(i);
                      setTransitionVers(null);
                      setChampsEtape({});
                    }}
                    className="card mb-2 w-full p-2.5 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <span className="block text-xs font-semibold leading-snug text-ink">{i.titre}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1">
                      {i.sousDomaine && (
                        <span className="rounded-full bg-violet-50 px-1.5 py-px text-[9.5px] font-bold text-statut-bleu">
                          {i.domaine} / {i.sousDomaine}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-1.5 py-px text-[9.5px] font-bold ${i.valeurMetier >= 5 ? 'bg-red-50 text-statut-rouge' : i.valeurMetier >= 4 ? 'bg-amber-50 text-statut-ambre' : 'bg-canvas text-slate-500'}`}
                        title="Valeur métier"
                      >
                        V{i.valeurMetier}
                      </span>
                      {i.lot && (
                        <span className="rounded-full bg-blue-50 px-1.5 py-px font-mono text-[9.5px] font-bold text-statut-bleu">
                          {i.lot}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tiroir fiche initiative */}
      <Tiroir titre={ouverte?.titre ?? ''} ouvert={ouverte !== null} onClose={() => setOuverte(null)}>
        {ouverte && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-statut-bleu">
                {ouverte.type} · {ouverte.mode}
              </span>
              {ouverte.domaine && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-bold text-statut-bleu">
                  {ouverte.domaine}{ouverte.sousDomaine ? ` / ${ouverte.sousDomaine}` : ''}
                </span>
              )}
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                {labelStatut(ouverte.mode, ouverte.statutCycle)}
              </span>
            </div>

            {ouverte.description && <p className="text-xs text-slate-600">{ouverte.description}</p>}

            {peutSaisir && transitionsPossibles(ouverte.mode, ouverte.statutCycle).length > 0 && (
              <div>
                <div className="label">Transitions possibles</div>
                <div className="flex flex-wrap gap-1.5">
                  {transitionsPossibles(ouverte.mode, ouverte.statutCycle).map((vers) => (
                    <button
                      key={vers}
                      type="button"
                      className={vers === transitionVers ? 'btn-primary !px-2.5 !py-1 text-[11px]' : 'btn-ghost !px-2.5 !py-1 text-[11px]'}
                      disabled={chargement}
                      onClick={() => lancerTransition(vers)}
                    >
                      → {labelStatut(ouverte.mode, vers)}
                    </button>
                  ))}
                </div>
                {transitionVers && champsRequisPour(transitionVers).length > 0 && (
                  <div className="mt-2 space-y-2 rounded-xl bg-canvas p-3">
                    {champsRequisPour(transitionVers).map((r) => (
                      <div key={r.champ}>
                        <label className="label" htmlFor={`etape-${r.champ}`}>{r.label}</label>
                        <input
                          id={`etape-${r.champ}`}
                          className="input"
                          value={champsEtape[r.champ] ?? ''}
                          onChange={(e) => setChampsEtape({ ...champsEtape, [r.champ]: e.target.value })}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-primary w-full !py-1.5 text-xs"
                      disabled={chargement}
                      onClick={() => lancerTransition(transitionVers)}
                    >
                      Confirmer → {labelStatut(ouverte.mode, transitionVers)}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="label">Rôles de l&apos;initiative (destinataires des notifications)</div>
              <dl className="space-y-1 text-xs">
                {(
                  [
                    ['Chef de projet DSI', ouverte.chefProjet],
                    ['CP externe (prestataire)', ouverte.chefProjetExterne],
                    ['Product Owner', ouverte.productOwner],
                    ['Proxy PO', ouverte.proxyPo],
                    ['Key users (recette)', ouverte.keyUsers],
                    ['Équipe MEP', ouverte.equipeMep],
                  ] as const
                ).map(([label, valeur]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-dashed border-ligne pb-1">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-semibold text-ink">{valeur || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <div className="label">Qualification</div>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between border-b border-dashed border-ligne pb-1">
                  <dt className="text-slate-500">Valeur métier</dt>
                  <dd className="font-semibold">{ouverte.valeurMetier}/5</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-ligne pb-1">
                  <dt className="text-slate-500">Effort estimé</dt>
                  <dd className="font-semibold">{ouverte.effortEstime ? `${ouverte.effortEstime} j/h` : '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-ligne pb-1">
                  <dt className="text-slate-500">Budget</dt>
                  <dd className="font-semibold">{ouverte.budget ? `${ouverte.budget} k MAD` : '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-ligne pb-1">
                  <dt className="text-slate-500">Lot / release</dt>
                  <dd className="font-mono font-semibold">{ouverte.lot ?? '—'}</dd>
                </div>
                {ouverte.motifGoNoGo && (
                  <div className="flex justify-between gap-3 border-b border-dashed border-ligne pb-1">
                    <dt className="text-slate-500">Décision Go/NoGo</dt>
                    <dd className="text-right font-semibold">{ouverte.motifGoNoGo}</dd>
                  </div>
                )}
                {ouverte.reservesRecette && (
                  <div className="flex justify-between gap-3 border-b border-dashed border-ligne pb-1">
                    <dt className="text-slate-500">Réserves de recette</dt>
                    <dd className="text-right font-semibold text-statut-rouge">{ouverte.reservesRecette}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <div className="label">Historique des transitions (lead time)</div>
              {ouverte.transitions.length === 0 ? (
                <p className="text-xs italic text-slate-400">Aucune transition — initiative en début de cycle.</p>
              ) : (
                <ul className="ml-1.5 space-y-2 border-l-2 border-ligne pl-3.5">
                  {ouverte.transitions.map((t, idx) => (
                    <li key={idx} className="relative text-xs">
                      <span className="absolute -left-[1.22rem] top-1 h-2 w-2 rounded-full border-2 border-white bg-accent-soft" />
                      <b>{labelStatut(ouverte.mode, t.vers)}</b>
                      <span className="block text-[10.5px] text-slate-500">
                        {fmtDate(t.createdAt)} · par {t.par}
                        {t.commentaire ? ` · ${t.commentaire}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Tiroir>

      {/* Tiroir de soumission */}
      <Tiroir titre="Soumettre une initiative" ouvert={creation} onClose={() => setCreation(false)}>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            DSI ou métier : toute idée entre ici, en début de cycle ({'"'}Non qualifié{'"'} ou {'"'}Backlog{'"'}).
            La DSI est notifiée pour qualification.
          </p>
          <div>
            <label className="label" htmlFor="ini-titre">Titre</label>
            <input id="ini-titre" className="input" value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ini-type">Type</label>
              <select id="ini-type" className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="INITIATIVE">Initiative</option>
                <option value="PROJET">Projet</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ini-mode">Mode de delivery</label>
              <select id="ini-mode" className="input" value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="WATERFALL">Waterfall</option>
                <option value="AGILE">Agile</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ini-domaine">Domaine métier</label>
              <select id="ini-domaine" className="input" value={form.domaineId}
                onChange={(e) => setForm({ ...form, domaineId: e.target.value, sousDomaineId: '' })}>
                <option value="">—</option>
                {domaines.map((d) => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ini-sous">Sous-domaine</label>
              <select id="ini-sous" className="input" value={form.sousDomaineId}
                onChange={(e) => setForm({ ...form, sousDomaineId: e.target.value })}>
                <option value="">—</option>
                {sousDomainesDuForm.map((sd) => (
                  <option key={sd.id} value={sd.id}>{sd.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ini-valeur">Valeur métier (1-5)</label>
              <input id="ini-valeur" type="number" min={1} max={5} className="input" value={form.valeurMetier}
                onChange={(e) => setForm({ ...form, valeurMetier: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="ini-po">Product Owner</label>
              <input id="ini-po" className="input" value={form.productOwner}
                onChange={(e) => setForm({ ...form, productOwner: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ini-cp">Chef de projet DSI</label>
              <input id="ini-cp" className="input" value={form.chefProjet}
                onChange={(e) => setForm({ ...form, chefProjet: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ini-proxy">Proxy PO</label>
              <input id="ini-proxy" className="input" value={form.proxyPo}
                onChange={(e) => setForm({ ...form, proxyPo: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ini-keyusers">Key users (séparés par ;)</label>
              <input id="ini-keyusers" className="input" value={form.keyUsers}
                onChange={(e) => setForm({ ...form, keyUsers: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ini-mep">Équipe MEP</label>
              <input id="ini-mep" className="input" value={form.equipeMep}
                onChange={(e) => setForm({ ...form, equipeMep: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ini-desc">Description / besoin métier</label>
            <textarea id="ini-desc" rows={3} className="input" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button type="button" className="btn-primary w-full" disabled={!form.titre.trim() || chargement} onClick={soumettre}>
            Soumettre au pipeline
          </button>
        </div>
      </Tiroir>
    </div>
  );
}
