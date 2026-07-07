'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DomaineDTO, InitiativeDTO } from '@/lib/ppm-db';
import { cyclePourMode, labelStatut } from '@/lib/ppm';
import { Onglets } from '@/components/ui/Onglets';

type TriCle = 'valeurMetier' | 'titre' | 'statutCycle' | 'updatedAt';

/**
 * Vue liste du portefeuille DSI : remplace l'écran « Plan d'actions » hérité
 * du PMO stratégique. Filtres par domaine / mode / statut de cycle, tri,
 * export CSV, et reprise des anciennes actions en un clic.
 */
export function InitiativesClient({
  initial,
  domaines,
  pilotage,
  actionsHeritees,
}: {
  initial: InitiativeDTO[];
  domaines: DomaineDTO[];
  pilotage: boolean;
  actionsHeritees: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'TOUS' | 'WATERFALL' | 'AGILE'>('TOUS');
  const [recherche, setRecherche] = useState('');
  const [domaineFiltre, setDomaineFiltre] = useState('tous');
  const [statutFiltre, setStatutFiltre] = useState('tous');
  const [tri, setTri] = useState<TriCle>('valeurMetier');
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const statutsDisponibles = useMemo(() => {
    const modes = mode === 'TOUS' ? ['WATERFALL', 'AGILE'] : [mode];
    const vus = new Set<string>();
    return modes.flatMap((m) =>
      cyclePourMode(m)
        .filter((e) => !vus.has(e.statut) && (vus.add(e.statut), true))
        .map((e) => ({ statut: e.statut, label: e.label })),
    );
  }, [mode]);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const rows = initial.filter(
      (i) =>
        (mode === 'TOUS' || i.mode === mode) &&
        (domaineFiltre === 'tous' || i.domaineId === domaineFiltre) &&
        (statutFiltre === 'tous' || i.statutCycle === statutFiltre) &&
        (q === '' ||
          [i.titre, i.productOwner, i.chefProjet, i.sousDomaine, i.lot]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))),
    );
    return [...rows].sort((a, b) => {
      if (tri === 'valeurMetier') return b.valeurMetier - a.valeurMetier;
      if (tri === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
      return String(a[tri]).localeCompare(String(b[tri]), 'fr');
    });
  }, [initial, mode, domaineFiltre, statutFiltre, recherche, tri]);

  const exporterCsv = () => {
    const sep = ';';
    const lignes = [
      ['Titre', 'Type', 'Mode', 'Statut', 'Domaine', 'Sous-domaine', 'Valeur', 'PO', 'CP DSI', 'Budget (k MAD)', 'Lot'].join(sep),
      ...visibles.map((i) =>
        [
          i.titre, i.type, i.mode, labelStatut(i.mode, i.statutCycle),
          i.domaine ?? '', i.sousDomaine ?? '', i.valeurMetier,
          i.productOwner ?? '', i.chefProjet ?? '', i.budget ?? '', i.lot ?? '',
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(sep),
      ),
    ].join('\r\n');
    const blob = new Blob([`﻿${lignes}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'initiatives-dsi.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importer = async () => {
    setChargement(true);
    setInfo(null);
    try {
      const res = await fetch('/api/initiatives/importer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? `Erreur ${res.status}`);
      const r = body?.data ?? body;
      setInfo(
        `Reprise terminée : ${r.importees} action(s) importée(s) en initiatives, ${r.ignorees} déjà présente(s).`,
      );
      router.refresh();
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Onglets
          onglets={[
            { key: 'TOUS', label: `Tous (${initial.length})` },
            { key: 'WATERFALL', label: 'Waterfall' },
            { key: 'AGILE', label: 'Agile' },
          ]}
          actif={mode}
          onChange={(m) => {
            setMode(m);
            setStatutFiltre('tous');
          }}
        />
        <input
          aria-label="Rechercher"
          className="input !w-56 !py-1.5 text-xs"
          placeholder="Rechercher (titre, PO, CP, lot)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select aria-label="Domaine" className="input !w-auto !py-1.5 text-xs" value={domaineFiltre}
          onChange={(e) => setDomaineFiltre(e.target.value)}>
          <option value="tous">Tous les domaines</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>{d.nom}</option>
          ))}
        </select>
        <select aria-label="Statut de cycle" className="input !w-auto !py-1.5 text-xs" value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}>
          <option value="tous">Tous statuts</option>
          {statutsDisponibles.map((s) => (
            <option key={s.statut} value={s.statut}>{s.label}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={exporterCsv}>
            Export CSV
          </button>
          <Link href="/pipeline" className="btn-primary !py-1.5 text-xs">
            ＋ Soumettre (pipeline)
          </Link>
        </div>
      </div>

      {pilotage && actionsHeritees > 0 && (
        <div className="card flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs text-slate-600">
          <span>
            🗂 Ce plan porte encore <b>{actionsHeritees} action(s)</b> de l&apos;ancien écran « Plan
            d&apos;actions » (héritage PMO stratégique). Vous pouvez les reprendre en initiatives
            waterfall — les originales sont conservées.
          </span>
          <button type="button" className="btn-ghost !px-2.5 !py-1 text-[11px]" disabled={chargement} onClick={importer}>
            {chargement ? 'Reprise…' : 'Reprendre en initiatives'}
          </button>
        </div>
      )}

      {info && <div className="card px-4 py-2 text-xs text-slate-700">{info}</div>}

      <div className="card card-liseret scrolly flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="cursor-pointer px-3 py-2.5" onClick={() => setTri('titre')}>Initiative / projet</th>
              <th className="px-3 py-2.5">Domaine / sous-domaine</th>
              <th className="px-3 py-2.5">Mode</th>
              <th className="cursor-pointer px-3 py-2.5" onClick={() => setTri('statutCycle')}>Statut de cycle</th>
              <th className="cursor-pointer px-3 py-2.5 text-center" onClick={() => setTri('valeurMetier')}>Valeur</th>
              <th className="px-3 py-2.5">PO métier</th>
              <th className="px-3 py-2.5">CP DSI</th>
              <th className="px-3 py-2.5 text-right">Budget</th>
              <th className="px-3 py-2.5">Lot</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((i) => (
              <tr key={i.id} className="border-t border-ligne/60 hover:bg-canvas">
                <td className="max-w-[280px] px-3 py-2">
                  <Link href={`/pipeline?focus=${i.id}`} className="font-semibold text-ink hover:text-accent hover:underline">
                    {i.titre}
                  </Link>
                  <span className="block text-[10px] text-slate-400">{i.type}</span>
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {i.domaine ?? '—'}
                  {i.sousDomaine && <span className="block text-[10.5px] text-slate-400">{i.sousDomaine}</span>}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i.mode === 'AGILE' ? 'bg-violet-50 text-statut-bleu' : 'bg-blue-50 text-statut-bleu'}`}>
                    {i.mode}
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold text-slate-700">{labelStatut(i.mode, i.statutCycle)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-grid h-6 w-7 place-items-center rounded-md font-mono text-[10.5px] font-bold text-white ${i.valeurMetier >= 5 ? 'bg-statut-rouge' : i.valeurMetier >= 4 ? 'bg-statut-ambre' : 'bg-statut-bleu'}`}>
                    V{i.valeurMetier}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{i.productOwner ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{i.chefProjet ?? '—'}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{i.budget ? `${i.budget.toLocaleString('fr-FR')} k` : '—'}</td>
                <td className="px-3 py-2 font-mono text-[10.5px]">{i.lot ?? '—'}</td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                  Aucune initiative ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[10.5px] text-slate-400">
        {visibles.length} initiative(s) affichée(s) · cliquez un titre pour ouvrir la fiche dans le pipeline.
      </p>
    </div>
  );
}
