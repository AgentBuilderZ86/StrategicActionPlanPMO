'use client';

import { useMemo, useState } from 'react';
import { STATUT_COLOR, STATUT_LABEL, type Statut } from '@/lib/constants';
import { calculerGantt, type GanttItem } from '@/lib/planning';
import { cn, fmtDate } from '@/lib/utils';

type ActionRow = GanttItem & { dateDebut: string | null; dateFin: string | null };
type Jalon = { id: string; actionId: string; titre: string; date: string; atteint: boolean };

export function PlanningClient({ actions, jalons }: { actions: ActionRow[]; jalons: Jalon[] }) {
  const [vue, setVue] = useState<'gantt' | 'calendrier'>('gantt');

  return (
    <div className="space-y-4">
      <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold">
        <button onClick={() => setVue('gantt')} className={cn('px-4 py-1.5', vue === 'gantt' ? 'bg-accent text-white' : 'bg-white text-slate-500')}>Gantt</button>
        <button onClick={() => setVue('calendrier')} className={cn('px-4 py-1.5', vue === 'calendrier' ? 'bg-accent text-white' : 'bg-white text-slate-500')}>Calendrier</button>
      </div>
      {vue === 'gantt' ? <GanttView actions={actions} /> : <CalendrierView actions={actions} jalons={jalons} />}
    </div>
  );
}

function GanttView({ actions }: { actions: ActionRow[] }) {
  const layout = useMemo(() => calculerGantt(actions), [actions]);
  if (!layout) {
    return <div className="card p-12 text-center text-slate-400">Aucune action datée à afficher.</div>;
  }
  return (
    <div className="card overflow-x-auto p-0">
      <div className="min-w-[760px]">
        {/* Repères mensuels */}
        <div className="relative ml-64 h-6 border-b border-slate-100">
          {layout.mois.map((m) => (
            <span key={m.label} className="absolute top-1 -translate-x-1/2 text-[10px] font-medium text-slate-400" style={{ left: `${m.offsetPct}%` }}>{m.label}</span>
          ))}
        </div>
        <ul>
          {layout.bars.map((b) => (
            <li key={b.id} className="flex items-center border-b border-slate-50 hover:bg-slate-50/60">
              <div className="w-64 shrink-0 truncate px-3 py-2 text-xs" style={{ paddingLeft: `${(b.niveau - 1) * 12 + 12}px` }} title={b.titre}>
                {b.code && <span className="mr-1 font-mono text-[10px] text-accent">{b.code}</span>}
                <span className="font-medium text-ink">{b.titre}</span>
              </div>
              <div className="relative h-8 grow">
                {/* Ligne « aujourd'hui » */}
                {layout.todayPct != null && (
                  <span className="absolute top-0 z-10 h-full w-px bg-statut-rouge/60" style={{ left: `${layout.todayPct}%` }} />
                )}
                {b.sansDates ? (
                  <span className="absolute top-1/2 -translate-y-1/2 pl-1 text-[10px] italic text-slate-300">non planifié</span>
                ) : (
                  <span
                    className="absolute top-1/2 h-4 -translate-y-1/2 rounded"
                    style={{ left: `${b.offsetPct}%`, width: `${b.widthPct}%`, backgroundColor: `${STATUT_COLOR[b.statut as Statut] ?? '#94a3b8'}33` }}
                    title={`${STATUT_LABEL[b.statut as Statut] ?? b.statut} · ${b.avancement}%`}
                  >
                    <span className="block h-full rounded" style={{ width: `${b.avancement}%`, backgroundColor: STATUT_COLOR[b.statut as Statut] ?? '#94a3b8' }} />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function CalendrierView({ actions, jalons }: { actions: ActionRow[]; jalons: Jalon[] }) {
  const [curseur, setCurseur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  // Évènements par jour (clé ISO yyyy-mm-dd).
  const parJour = useMemo(() => {
    const map = new Map<string, { type: 'echeance' | 'jalon'; titre: string; statut?: string; atteint?: boolean }[]>();
    const push = (iso: string, ev: { type: 'echeance' | 'jalon'; titre: string; statut?: string; atteint?: boolean }) => {
      const k = iso.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    };
    for (const a of actions) if (a.dateFin) push(a.dateFin, { type: 'echeance', titre: a.titre, statut: a.statut });
    for (const j of jalons) push(j.date, { type: 'jalon', titre: j.titre, atteint: j.atteint });
    return map;
  }, [actions, jalons]);

  const annee = curseur.getFullYear();
  const mois = curseur.getMonth();
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7; // Lundi = 0
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const cases: (number | null)[] = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => i + 1)];
  const nomMois = premier.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCurseur(new Date(annee, mois - 1, 1))} className="btn-ghost px-3 py-1.5 text-sm">← Précédent</button>
        <span className="font-title text-sm font-bold capitalize text-ink">{nomMois}</span>
        <button onClick={() => setCurseur(new Date(annee, mois + 1, 1))} className="btn-ghost px-3 py-1.5 text-sm">Suivant →</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j) => <div key={j} className="pb-1 text-center text-[11px] font-semibold text-slate-400">{j}</div>)}
        {cases.map((jour, i) => {
          if (jour == null) return <div key={`v${i}`} />;
          const iso = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
          const evs = parJour.get(iso) ?? [];
          const estAujourdhui = new Date().toISOString().slice(0, 10) === iso;
          return (
            <div key={iso} className={cn('min-h-[72px] rounded-lg border p-1', estAujourdhui ? 'border-accent bg-accent/5' : 'border-slate-100')}>
              <div className="mb-0.5 text-right text-[10px] font-semibold text-slate-400">{jour}</div>
              <div className="space-y-0.5">
                {evs.slice(0, 3).map((ev, k) => (
                  <div key={k} className={cn('truncate rounded px-1 py-0.5 text-[9px] font-medium', ev.type === 'jalon' ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-ink')} title={ev.titre}>
                    {ev.type === 'jalon' ? '◆ ' : '● '}{ev.titre}
                  </div>
                ))}
                {evs.length > 3 && <div className="text-[9px] text-slate-400">+{evs.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">● échéance d’action · ◆ jalon · aujourd’hui : {fmtDate(new Date())}</p>
    </div>
  );
}
