'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AlerteDTO } from '@/lib/alertes-db';
import { ALERTE_STATUT_LABEL, type AlerteStatut } from '@/lib/alertes';
import { NIVEAU_RISQUE_COLOR, type NiveauRisque } from '@/lib/risque';
import { cn, fmtDate, fmtPct } from '@/lib/utils';
import { enjeuAction } from '@/lib/impact-sr';
import { EnjeuVies } from '@/components/ui/EnjeuVies';

const ONGLETS: { key: AlerteStatut; label: string }[] = [
  { key: 'NOUVELLE', label: 'Nouvelles' },
  { key: 'PRISE_EN_CHARGE', label: 'Prises en charge' },
  { key: 'ACCEPTEE', label: 'Risques acceptés' },
  { key: 'RESOLUE', label: 'Résolues' },
];

/**
 * File de traitement des alertes : chaque carte porte le diagnostic (facteurs
 * explicables) et les gestes du cycle de vie. L'acceptation d'un risque exige
 * un motif, tracé pour le COPIL.
 */
export function AlertesClient({ initial, pilotage }: { initial: AlerteDTO[]; pilotage: boolean }) {
  const router = useRouter();
  const [alertes, setAlertes] = useState(initial);
  const [onglet, setOnglet] = useState<AlerteStatut>('NOUVELLE');
  const [motifPour, setMotifPour] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [chargement, setChargement] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const compteurs = useMemo(() => {
    const c = new Map<string, number>();
    for (const a of alertes) c.set(a.statut, (c.get(a.statut) ?? 0) + 1);
    return c;
  }, [alertes]);

  const visibles = alertes.filter((a) => a.statut === onglet);

  const patcher = async (id: string, statut: AlerteStatut, motifTexte?: string) => {
    setChargement(id);
    setInfo(null);
    try {
      const res = await fetch(`/api/alertes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, motif: motifTexte ?? null }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? `Erreur ${res.status}`);
      setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, statut, motif: motifTexte ?? a.motif } : a)));
      setMotifPour(null);
      setMotif('');
      router.refresh();
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setChargement(null);
    }
  };

  const digest = async () => {
    setInfo(null);
    const res = await fetch('/api/alertes/digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const body = await res.json().catch(() => null);
    setInfo(
      res.ok
        ? body?.envoye
          ? 'Digest envoyé aux profils ADMIN et PMO (cloche de notifications).'
          : 'Aucune alerte ouverte : digest non envoyé.'
        : body?.error?.message ?? 'Erreur lors de l’envoi du digest',
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrer par statut">
          {ONGLETS.map((o) => (
            <button
              key={o.key}
              type="button"
              role="tab"
              aria-selected={onglet === o.key}
              onClick={() => setOnglet(o.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                onglet === o.key ? 'bg-ink text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {o.label} ({compteurs.get(o.key) ?? 0})
            </button>
          ))}
        </div>
        {pilotage && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={chargement === 'sync'}
              onClick={async () => {
                setChargement('sync');
                setInfo(null);
                const res = await fetch('/api/alertes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                const body = await res.json().catch(() => null);
                setChargement(null);
                if (res.ok) {
                  const r = body?.data ?? body;
                  setInfo(`Synchronisation : ${r.creees} créée(s), ${r.misesAJour} mise(s) à jour, ${r.resolues} résolue(s).`);
                  router.refresh();
                } else {
                  setInfo(body?.error?.message ?? 'Erreur de synchronisation');
                }
              }}
            >
              {chargement === 'sync' ? 'Analyse…' : '⟳ Actualiser'}
            </button>
            <button type="button" className="btn-ghost" onClick={digest}>
              ✉ Envoyer le digest
            </button>
          </div>
        )}
      </div>

      {info && <div className="mb-3 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700">{info}</div>}

      {visibles.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          {onglet === 'NOUVELLE'
            ? '✓ Aucune nouvelle alerte. Le moteur de risque n’a détecté aucune dérive non traitée.'
            : 'Aucune alerte dans cet état.'}
        </div>
      ) : (
        <div className="card card-liseret scrolly max-h-[68vh] px-2 py-1.5">
          {visibles.map((a) => {
            const color = NIVEAU_RISQUE_COLOR[a.niveau as NiveauRisque] ?? '#586059';
            const enjeu = enjeuAction({ titre: a.action.titre, axe: a.action.axe });
            const principal = a.facteurs[0] ?? null;
            return (
              <details key={a.id} className="group border-b border-ligne/70 last:border-0">
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-canvas [&::-webkit-details-marker]:hidden">
                  <span
                    className="grid h-9 w-9 flex-none place-items-center rounded-lg font-mono text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {a.score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{a.action.titre}</span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {[a.action.axe, a.action.pays, a.action.responsable].filter(Boolean).join(' · ')}
                      {principal ? ` · ${principal.label}` : ''}
                    </span>
                  </span>
                  {enjeu && <EnjeuVies levier={enjeu.levier} />}
                  <span className="hidden text-[10.5px] font-semibold text-slate-400 sm:block">
                    {ALERTE_STATUT_LABEL[a.statut as AlerteStatut] ?? a.statut}
                  </span>
                  {pilotage && a.statut === 'NOUVELLE' && (
                    <button
                      type="button"
                      className="btn-primary !px-2.5 !py-1 text-[11px]"
                      disabled={chargement === a.id}
                      onClick={(e) => {
                        e.preventDefault();
                        patcher(a.id, 'PRISE_EN_CHARGE');
                      }}
                    >
                      Prendre en charge
                    </button>
                  )}
                  <span aria-hidden className="text-slate-300 transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="space-y-2 px-2.5 pb-3 pl-[3.6rem]">
                  <ul className="space-y-0.5">
                    {a.facteurs.map((f) => (
                      <li key={f.code} className="text-xs text-slate-600">
                        <span className="font-semibold text-ink">{f.label}</span>
                        <span className="font-mono font-bold tabular-nums" style={{ color }}> +{f.points}</span>
                        {' — '}
                        {f.detail}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-slate-500">
                    Avancement {fmtPct(a.action.avancement)} · échéance {fmtDate(a.action.dateFin)} · mise à jour {fmtDate(a.updatedAt)}
                    {a.motif ? ` · motif : ${a.motif}` : ''}
                  </div>
                  {pilotage && (a.statut === 'NOUVELLE' || a.statut === 'PRISE_EN_CHARGE') && (
                    <div className="flex flex-wrap items-center gap-2">
                      {a.statut === 'PRISE_EN_CHARGE' && (
                        <button
                          type="button"
                          className="btn-primary !px-2.5 !py-1 text-[11px]"
                          disabled={chargement === a.id}
                          onClick={() => patcher(a.id, 'RESOLUE', 'Traitée par le PMO')}
                        >
                          Marquer résolue
                        </button>
                      )}
                      {motifPour === a.id ? (
                        <span className="flex grow items-center gap-2">
                          <input
                            className="input !w-auto grow !py-1 text-xs"
                            placeholder="Motif d'acceptation (requis, tracé pour le COPIL)"
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-ghost !px-2.5 !py-1 text-[11px]"
                            disabled={!motif.trim() || chargement === a.id}
                            onClick={() => patcher(a.id, 'ACCEPTEE', motif.trim())}
                          >
                            Confirmer
                          </button>
                          <button type="button" className="text-[11px] text-slate-400" onClick={() => setMotifPour(null)}>
                            Annuler
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost !px-2.5 !py-1 text-[11px]"
                          onClick={() => {
                            setMotifPour(a.id);
                            setMotif('');
                          }}
                        >
                          Accepter le risque
                        </button>
                      )}
                      <Link
                        href={`/actions?focus=${a.actionId}`}
                        className="ml-auto text-[11px] font-semibold text-accent hover:underline"
                      >
                        Ouvrir l&apos;action →
                      </Link>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
