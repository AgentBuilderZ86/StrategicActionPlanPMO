'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';

type ImportReport = {
  created: number;
  total: number;
  errors: { ligne: number; message?: string; titre?: string }[];
};

// En-têtes reconnus → clés internes (insensible à la casse/accents)
const COLUMN_MAP: Record<string, string> = {
  titre: 'titre', axe: 'axe', pays: 'pays', entite: 'entite', entité: 'entite',
  responsable: 'responsable', statut: 'statut', avancement: 'avancement',
  priorite: 'priorite', priorité: 'priorite', debut: 'dateDebut', début: 'dateDebut',
  fin: 'dateFin', budget: 'budget', commentaire: 'commentaire',
};

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '');
  const delim = clean.split('\n')[0]?.includes(';') ? ';' : ',';
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(delim).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(delim);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      const key = COLUMN_MAP[h] ?? h;
      row[key] = (cells[i] ?? '').trim().replace(/^"|"$/g, '');
    });
    return row;
  });
}

export function ImportDialog({ planId, open, onClose }: { planId: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { setError('Fichier vide ou en-têtes manquants.'); return; }
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, rows }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body?.error?.message ?? 'Échec de l’import'); return; }
      setReport(body);
      router.refresh();
    } catch {
      setError('Lecture du fichier impossible.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Importer des actions (CSV)">
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Colonnes attendues : <strong>Titre, Axe, Pays, Entité, Responsable</strong> (requis), puis
          Statut, Avancement, Priorité, Début, Fin, Budget, Commentaire. Séparateur <code>;</code> ou <code>,</code>.
          Les axes, pays et entités doivent exister dans le référentiel.
        </div>
        <label className="btn-primary cursor-pointer">
          {busy ? 'Import en cours…' : 'Choisir un fichier CSV'}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} disabled={busy} />
        </label>

        {error && <p className="text-statut-rouge">{error}</p>}

        {report && (
          <div className="space-y-2">
            <p className="font-semibold text-statut-vert">
              {report.created} action(s) importée(s) sur {report.total}.
            </p>
            {report.errors.length > 0 && (
              <div className="rounded-lg border border-statut-rouge/30 bg-statut-rouge/5 p-3">
                <p className="mb-1 font-semibold text-statut-rouge">{report.errors.length} erreur(s) :</p>
                <ul className="space-y-1 text-xs text-ink">
                  {report.errors.map((er, i) => (
                    <li key={i}>Ligne {er.ligne}{er.titre ? ` (${er.titre})` : ''} : {er.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
