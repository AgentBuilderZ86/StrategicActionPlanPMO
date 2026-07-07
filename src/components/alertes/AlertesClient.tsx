'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AlerteDTO } from '@/lib/alertes-db';
import { ALERTE_STATUT_LABEL, type AlerteStatut } from '@/lib/alertes';
import { NIVEAU_RISQUE_COLOR, type NiveauRisque } from '@/lib/risque';
import { cn, fmtDate, fmtPct } from '@/lib/utils';

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
          <button type="button" className="btn-ghost" onClick={digest}>
            ✉ Envoyer le digest
          </button>
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
        <div className="space-y-3">
          {visibles.map((a) => {
            const color = NIVEAU_RISQUE_COLOR[a.niveau as NiveauRisque] ?? '#64748B';
            return (
              <div key={a.id} className="card p-4" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="flex flex-wrap items-start gap-3">
                  <div
                    className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: color }}
                  >
                    <span className="font-title text-sm font-extrabold tabular-nums leading-none">{a.score}</span>
                    <span className="text-[8px] font-semibold uppercase opacity-90">risque</span>
                  </div>
                  <div className="min-w-0 grow">
                    <Link href={`/actions?focus=${a.actionId}`} className="font-semibold text-ink hover:underline">
                      {a.action.titre}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {[a.action.axe, a.action.pays, a.action.responsable].filter(Boolean).join(' · ')}
                      {' · '}avancement {fmtPct(a.action.avancement)} · échéance {fmtDate(a.action.dateFin)}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {a.facteurs.map((f) => (
                        <li key={f.code} className="text-xs text-slate-600">
                          <span className="font-semibold text-ink">{f.label}</span>
                          <span className="tabular-nums font-semibold" style={{ color }}> +{f.points}</span>
                          {' — '}{f.detail}
                        </li>
                      ))}
                    </ul>
                    {a.motif && (
                      <div className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                        Motif : {a.motif}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    {ALERTE_STATUT_LABEL[a.statut as AlerteStatut] ?? a.statut}
                    <br />
                    {fmtDate(a.updatedAt)}
                  </div>
                </div>

                {pilotage && (a.statut === 'NOUVELLE' || a.statut === 'PRISE_EN_CHARGE') && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    {a.statut === 'NOUVELLE' && (
                      <button
                        type="button"
                        className="btn-primary !px-3 !py-1.5 text-xs"
                        disabled={chargement === a.id}
                        onClick={() => patcher(a.id, 'PRISE_EN_CHARGE')}
                      >
                        Prendre en charge
                      </button>
                    )}
                    {a.statut === 'PRISE_EN_CHARGE' && (
                      <button
                        type="button"
                        className="btn-primary !px-3 !py-1.5 text-xs"
                        disabled={chargement === a.id}
                        onClick={() => patcher(a.id, 'RESOLUE', 'Traitée par le PMO')}
                      >
                        Marquer résolue
                      </button>
                    )}
                    {motifPour === a.id ? (
                      <span className="flex grow items-center gap-2">
                        <input
                          className="input !w-auto grow"
                          placeholder="Motif d’acceptation (requis, tracé pour le COPIL)"
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          disabled={!motif.trim() || chargement === a.id}
                          onClick={() => patcher(a.id, 'ACCEPTEE', motif.trim())}
                        >
                          Confirmer
                        </button>
                        <button type="button" className="text-xs text-slate-400" onClick={() => setMotifPour(null)}>
                          Annuler
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                        onClick={() => {
                          setMotifPour(a.id);
                          setMotif('');
                        }}
                      >
                        Accepter le risque
                      </button>
                    )}
                    <Link href={`/actions?focus=${a.actionId}`} className="ml-auto text-xs font-semibold text-accent hover:underline">
                      Ouvrir l’action →
                    </Link>
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
