import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/* ------------------------------------------------------------------ *
 * Brand system
 * Tailwind handles layout; brand hex values are applied inline so the
 * component is self-contained and does not depend on arbitrary-value
 * support in the Tailwind build.
 * ------------------------------------------------------------------ */
const BRAND = {
  ink: '#0B2545', // deep ink-blue — control-tower authority
  inkSoft: '#15315C',
  cobalt: '#1D4ED8', // primary accent
  cobaltSoft: '#3B82F6',
  bg: '#F4F6FB', // soft neutral background
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
};

const STATUS = {
  done: { key: 'done', label: 'Terminé', color: '#16A34A', soft: '#DCFCE7' },
  on_track: { key: 'on_track', label: 'En bonne voie', color: '#0EA5E9', soft: '#E0F2FE' },
  at_risk: { key: 'at_risk', label: 'À risque', color: '#F59E0B', soft: '#FEF3C7' },
  blocked: { key: 'blocked', label: 'Bloqué', color: '#DC2626', soft: '#FEE2E2' },
  not_started: { key: 'not_started', label: 'Non démarré', color: '#64748B', soft: '#F1F5F9' },
};
const STATUS_ORDER = ['not_started', 'on_track', 'at_risk', 'blocked', 'done'];

const PRIORITIES = {
  high: { key: 'high', label: 'Haute', color: '#DC2626', rank: 3 },
  medium: { key: 'medium', label: 'Moyenne', color: '#F59E0B', rank: 2 },
  low: { key: 'low', label: 'Basse', color: '#64748B', rank: 1 },
};

const STORAGE_KEY = 'pmo-app-data-v1';
const CURRENCY = 'k€';

/* ------------------------------------------------------------------ *
 * Referentials & seed data (West African footprint)
 * ------------------------------------------------------------------ */
const DEFAULT_CONFIG = {
  planName: "Plan d'Action Stratégique 2026",
  axes: [
    'Transformation Digitale',
    'Excellence Opérationnelle',
    'Conformité & Risques',
    'Développement Commercial',
    'Capital Humain',
    'Finance & Performance',
  ],
  countries: [
    "Côte d'Ivoire",
    'Sénégal',
    'Mali',
    'Burkina Faso',
    'Bénin',
    'Togo',
    'Guinée',
    'Ghana',
  ],
  entities: [
    'Holding Régionale',
    'Filiale Banque',
    'Filiale Assurance',
    'Filiale Télécom',
    'Centre de Services Partagés',
  ],
  owners: [
    'A. Diallo',
    'M. Koné',
    'F. Touré',
    'S. Mensah',
    'K. Ouédraogo',
    'L. Adjovi',
    'N. Camara',
  ],
};

let _seedId = 0;
const sid = () => `seed-${++_seedId}`;

function buildSeedActions() {
  const A = DEFAULT_CONFIG.axes;
  const C = DEFAULT_CONFIG.countries;
  const E = DEFAULT_CONFIG.entities;
  const O = DEFAULT_CONFIG.owners;
  const mk = (title, axis, country, entity, owner, status, progress, priority, start, end, budget, notes) => ({
    id: sid(),
    title,
    axis,
    country,
    entity,
    owner,
    status,
    progress,
    priority,
    startDate: start,
    endDate: end,
    budget,
    notes,
  });

  return [
    mk('Déploiement plateforme bancaire mobile', A[0], C[0], E[1], O[0], 'on_track', 65, 'high', '2026-01-15', '2026-09-30', 850, 'Pilote en cours sur Abidjan.'),
    mk('Migration data center régional', A[0], C[1], E[0], O[2], 'at_risk', 40, 'high', '2026-02-01', '2026-08-15', 1200, 'Dépendance fournisseur cloud.'),
    mk('Refonte parcours souscription assurance', A[0], C[0], E[2], O[3], 'on_track', 55, 'medium', '2026-01-10', '2026-10-31', 420, ''),
    mk('Automatisation back-office paiements', A[1], C[2], E[1], O[1], 'blocked', 25, 'high', '2025-11-01', '2026-04-30', 300, 'En attente validation réglementaire.'),
    mk('Programme Lean agences', A[1], C[3], E[1], O[4], 'on_track', 70, 'medium', '2026-01-05', '2026-07-31', 180, ''),
    mk('Centralisation achats Groupe', A[1], C[0], E[4], O[0], 'done', 100, 'medium', '2025-09-01', '2026-02-28', 220, 'Économies réalisées : 9%.'),
    mk('Mise en conformité LCB-FT', A[2], C[1], E[1], O[2], 'at_risk', 50, 'high', '2025-12-01', '2026-06-30', 360, 'Audit régulateur prévu Q3.'),
    mk('Cartographie des risques opérationnels', A[2], C[4], E[0], O[5], 'on_track', 60, 'medium', '2026-01-20', '2026-09-15', 140, ''),
    mk('Plan de continuité d\'activité', A[2], C[5], E[1], O[6], 'not_started', 0, 'high', '2026-04-01', '2026-11-30', 200, ''),
    mk('Conquête segment PME', A[3], C[0], E[1], O[3], 'on_track', 45, 'high', '2026-02-15', '2026-12-15', 500, ''),
    mk('Lancement offre télécom data', A[3], C[6], E[3], O[1], 'at_risk', 35, 'medium', '2026-01-25', '2026-08-31', 640, 'Concurrence agressive.'),
    mk('Réseau de distribution rural', A[3], C[2], E[1], O[4], 'blocked', 20, 'medium', '2025-10-15', '2026-05-31', 280, 'Problèmes logistiques.'),
    mk('Académie des talents Groupe', A[4], C[0], E[0], O[5], 'on_track', 58, 'medium', '2026-01-12', '2026-10-30', 190, ''),
    mk('Programme mobilité interne', A[4], C[1], E[0], O[6], 'not_started', 5, 'low', '2026-05-01', '2026-12-31', 90, ''),
    mk('Digitalisation des RH', A[4], C[7], E[4], O[2], 'on_track', 48, 'medium', '2026-02-01', '2026-09-30', 160, ''),
    mk('Clôture comptable accélérée', A[5], C[0], E[0], O[0], 'done', 100, 'high', '2025-08-01', '2026-01-31', 110, 'J+5 atteint.'),
    mk('Pilotage budgétaire unifié', A[5], C[1], E[0], O[2], 'at_risk', 42, 'high', '2026-01-15', '2026-07-31', 240, 'Qualité des données à fiabiliser.'),
    mk('Optimisation fiscale régionale', A[5], C[4], E[0], O[5], 'on_track', 52, 'medium', '2026-02-10', '2026-10-15', 130, ''),
    mk('Portail client unifié', A[0], C[3], E[1], O[4], 'not_started', 0, 'medium', '2026-06-01', '2027-01-31', 380, ''),
    mk('Tableau de bord ESG', A[2], C[0], E[0], O[3], 'on_track', 33, 'low', '2026-03-01', '2026-11-30', 95, ''),
    mk('Modernisation des guichets', A[1], C[5], E[1], O[6], 'blocked', 15, 'low', '2025-12-10', '2026-05-15', 210, 'Retard fournisseur matériel.'),
    mk('Stratégie de fidélisation', A[3], C[1], E[2], O[3], 'on_track', 62, 'medium', '2026-01-08', '2026-09-30', 175, ''),
    mk('Cybersécurité — SOC régional', A[0], C[0], E[0], O[0], 'at_risk', 38, 'high', '2026-01-20', '2026-12-31', 720, 'Recrutement analystes en cours.'),
    mk('Référentiel données client', A[5], C[6], E[3], O[1], 'not_started', 0, 'medium', '2026-07-01', '2027-03-31', 260, ''),
  ];
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */
function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.config || !Array.isArray(parsed.actions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / unavailable — fail silently */
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
const todayISO = () => new Date().toISOString().slice(0, 10);

function isOverdue(action) {
  if (!action.endDate) return false;
  if (action.status === 'done') return false;
  return action.endDate < todayISO();
}

function effectiveStatus(action) {
  // An action whose deadline has passed is surfaced as at-risk at minimum.
  if (isOverdue(action) && action.status !== 'blocked') return 'at_risk';
  return action.status;
}

const fmtMoney = (n) => `${Number(n || 0).toLocaleString('fr-FR')} ${CURRENCY}`;
const fmtPct = (n) => `${Math.round(n || 0)}%`;

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function uid() {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(actions) {
  const headers = [
    'id', 'titre', 'axe', 'pays', 'entite', 'responsable', 'statut',
    'avancement', 'priorite', 'debut', 'fin', 'budget_keur', 'notes',
  ];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = actions.map((a) =>
    [
      a.id, a.title, a.axis, a.country, a.entity, a.owner,
      STATUS[a.status]?.label || a.status, a.progress,
      PRIORITIES[a.priority]?.label || a.priority,
      a.startDate, a.endDate, a.budget, a.notes,
    ].map(esc).join(';')
  );
  return [headers.join(';'), ...rows].join('\n');
}

/* ------------------------------------------------------------------ *
 * Small UI primitives
 * ------------------------------------------------------------------ */
function StatusBadge({ status, overdue }) {
  const s = STATUS[status] || STATUS.not_started;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.soft, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
      {overdue && <span title="Échéance dépassée">⏰</span>}
    </span>
  );
}

function PriorityDot({ priority }) {
  const p = PRIORITIES[priority] || PRIORITIES.low;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: BRAND.text }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
      {p.label}
    </span>
  );
}

function ProgressBar({ value, color }) {
  const c = color || BRAND.cobalt;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#EEF2F7' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: c }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: BRAND.textMuted }}>
        {fmtPct(value)}
      </span>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}
    >
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND.textMuted }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: accent || BRAND.ink }}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs" style={{ color: BRAND.textMuted }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: BRAND.ink }}>
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs" style={{ color: BRAND.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* heat color for the matrix: 0% -> pale, 100% -> deep cobalt */
function heatColor(pct, count) {
  if (!count) return { bg: '#F8FAFC', fg: '#CBD5E1' };
  const t = Math.max(0, Math.min(1, pct / 100));
  // interpolate between a pale blue and ink/cobalt
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  const r = lerp(224, 11);
  const g = lerp(238, 37);
  const b = lerp(255, 101);
  const bg = `rgb(${r}, ${g}, ${b})`;
  const fg = t > 0.55 ? '#FFFFFF' : BRAND.ink;
  return { bg, fg };
}

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */
function Dashboard({ actions, config }) {
  const stats = useMemo(() => {
    const total = actions.length;
    const done = actions.filter((a) => a.status === 'done').length;
    const blocked = actions.filter((a) => a.status === 'blocked').length;
    const overdue = actions.filter((a) => isOverdue(a)).length;
    const budget = actions.reduce((s, a) => s + Number(a.budget || 0), 0);
    const progress = avg(actions.map((a) => Number(a.progress || 0)));
    return { total, done, blocked, overdue, budget, progress };
  }, [actions]);

  const byAxis = useMemo(() => {
    return config.axes.map((axis) => {
      const subset = actions.filter((a) => a.axis === axis);
      return {
        axis,
        short: axis.length > 16 ? axis.slice(0, 15) + '…' : axis,
        avancement: Math.round(avg(subset.map((a) => Number(a.progress || 0)))),
        actions: subset.length,
        budget: subset.reduce((s, a) => s + Number(a.budget || 0), 0),
      };
    });
  }, [actions, config.axes]);

  const byStatus = useMemo(() => {
    return STATUS_ORDER.map((key) => ({
      key,
      name: STATUS[key].label,
      value: actions.filter((a) => a.status === key).length,
      color: STATUS[key].color,
    })).filter((d) => d.value > 0);
  }, [actions]);

  const byCountry = useMemo(() => {
    return config.countries
      .map((country) => {
        const subset = actions.filter((a) => a.country === country);
        return {
          country,
          actions: subset.length,
          avancement: Math.round(avg(subset.map((a) => Number(a.progress || 0)))),
        };
      })
      .filter((d) => d.actions > 0);
  }, [actions, config.countries]);

  // Heatmap: average progress by country (rows) x axis (cols)
  const matrix = useMemo(() => {
    return config.countries.map((country) => {
      const cells = config.axes.map((axis) => {
        const subset = actions.filter((a) => a.country === country && a.axis === axis);
        return {
          axis,
          count: subset.length,
          pct: Math.round(avg(subset.map((a) => Number(a.progress || 0)))),
        };
      });
      const countryActions = actions.filter((a) => a.country === country);
      return { country, cells, total: countryActions.length };
    });
  }, [actions, config.countries, config.axes]);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Actions totales" value={stats.total} sub="dans le plan" />
        <KpiCard label="Avancement moyen" value={fmtPct(stats.progress)} sub="toutes actions" accent={BRAND.cobalt} />
        <KpiCard label="Terminées" value={stats.done} sub={`${fmtPct((stats.done / (stats.total || 1)) * 100)} du plan`} accent={STATUS.done.color} />
        <KpiCard label="Bloquées" value={stats.blocked} sub="à débloquer" accent={STATUS.blocked.color} />
        <KpiCard label="Budget total" value={fmtMoney(stats.budget)} sub={`${stats.overdue} en retard`} />
      </div>

      {/* Heatmap */}
      <SectionCard
        title="Matrice d'avancement — Pays × Axes"
        subtitle="Avancement moyen (%) par pays et par axe stratégique. La densité de couleur reflète la progression."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 p-2 text-left text-xs font-bold" style={{ color: BRAND.ink, backgroundColor: BRAND.surface }}>
                  Pays
                </th>
                {config.axes.map((axis) => (
                  <th key={axis} className="p-2 text-center align-bottom text-xs font-semibold" style={{ color: BRAND.textMuted, minWidth: 92 }}>
                    {axis}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.country}>
                  <td className="sticky left-0 z-10 whitespace-nowrap p-2 text-xs font-semibold" style={{ color: BRAND.ink, backgroundColor: BRAND.surface }}>
                    {row.country}
                  </td>
                  {row.cells.map((cell) => {
                    const { bg, fg } = heatColor(cell.pct, cell.count);
                    return (
                      <td key={cell.axis} className="p-1">
                        <div
                          className="flex h-12 flex-col items-center justify-center rounded-lg text-xs font-bold"
                          style={{ backgroundColor: bg, color: fg }}
                          title={`${row.country} · ${cell.axis}\n${cell.count} action(s) · ${cell.pct}% d'avancement`}
                        >
                          {cell.count ? (
                            <>
                              <span>{cell.pct}%</span>
                              <span className="text-[10px] font-medium opacity-80">{cell.count} act.</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-medium">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Avancement par axe" subtitle="Avancement moyen (%) par axe stratégique">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAxis} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="short" tick={{ fontSize: 11, fill: BRAND.textMuted }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: BRAND.textMuted }} />
              <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l, p) => p?.[0]?.payload?.axis || l} />
              <Bar dataKey="avancement" name="Avancement" radius={[6, 6, 0, 0]} fill={BRAND.cobalt} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Répartition par statut" subtitle="Nombre d'actions par statut">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={2}>
                {byStatus.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Budget par axe" subtitle={`Budget alloué (${CURRENCY}) par axe`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAxis} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="short" tick={{ fontSize: 11, fill: BRAND.textMuted }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: BRAND.textMuted }} />
              <Tooltip formatter={(v) => fmtMoney(v)} labelFormatter={(l, p) => p?.[0]?.payload?.axis || l} />
              <Bar dataKey="budget" name="Budget" radius={[6, 6, 0, 0]} fill={BRAND.ink} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Activité par pays" subtitle="Nombre d'actions et avancement moyen par pays">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCountry} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="country" tick={{ fontSize: 11, fill: BRAND.textMuted }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: BRAND.textMuted }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: BRAND.textMuted }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="actions" name="Actions" radius={[6, 6, 0, 0]} fill={BRAND.cobaltSoft} />
              <Bar yAxisId="right" dataKey="avancement" name="Avancement %" radius={[6, 6, 0, 0]} fill={BRAND.ink} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Action modal
 * ------------------------------------------------------------------ */
function ActionModal({ action, config, onSave, onClose }) {
  const blank = {
    title: '',
    axis: config.axes[0] || '',
    country: config.countries[0] || '',
    entity: config.entities[0] || '',
    owner: config.owners[0] || '',
    status: 'not_started',
    progress: 0,
    priority: 'medium',
    startDate: todayISO(),
    endDate: '',
    budget: 0,
    notes: '',
  };
  const [form, setForm] = useState(action ? { ...action } : blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      budget: Math.max(0, Number(form.budget) || 0),
      id: form.id || uid(),
    });
  };

  const field = 'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2';
  const fieldStyle = { borderColor: BRAND.border, color: BRAND.text };
  const labelCls = 'mb-1 block text-xs font-semibold';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,37,69,0.55)' }} onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: BRAND.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: BRAND.ink }}>
            {action ? 'Modifier une action' : 'Nouvelle action'}
          </h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold" style={{ color: BRAND.textMuted }}>
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls} style={{ color: BRAND.textMuted }}>Intitulé de l'action *</label>
            <input className={field} style={fieldStyle} value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Axe</label>
              <select className={field} style={fieldStyle} value={form.axis} onChange={(e) => set('axis', e.target.value)}>
                {config.axes.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Responsable</label>
              <select className={field} style={fieldStyle} value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                {config.owners.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Pays</label>
              <select className={field} style={fieldStyle} value={form.country} onChange={(e) => set('country', e.target.value)}>
                {config.countries.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Entité</label>
              <select className={field} style={fieldStyle} value={form.entity} onChange={(e) => set('entity', e.target.value)}>
                {config.entities.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Statut</label>
              <select className={field} style={fieldStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Priorité</label>
              <select className={field} style={fieldStyle} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {Object.values(PRIORITIES).map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Date de début</label>
              <input type="date" className={field} style={fieldStyle} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Date de fin</label>
              <input type="date" className={field} style={fieldStyle} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Avancement (%)</label>
              <input type="number" min="0" max="100" className={field} style={fieldStyle} value={form.progress} onChange={(e) => set('progress', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: BRAND.textMuted }}>Budget ({CURRENCY})</label>
              <input type="number" min="0" className={field} style={fieldStyle} value={form.budget} onChange={(e) => set('budget', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls} style={{ color: BRAND.textMuted }}>Notes</label>
            <textarea rows={3} className={field} style={fieldStyle} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
              Annuler
            </button>
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BRAND.cobalt }}>
              {action ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Action Plan tab
 * ------------------------------------------------------------------ */
function ActionPlan({ actions, config, onAdd, onUpdate, onDelete }) {
  const [filters, setFilters] = useState({ q: '', axis: '', country: '', entity: '', status: '', priority: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      if (filters.q && !`${a.title} ${a.notes} ${a.owner}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.axis && a.axis !== filters.axis) return false;
      if (filters.country && a.country !== filters.country) return false;
      if (filters.entity && a.entity !== filters.entity) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.priority && a.priority !== filters.priority) return false;
      return true;
    });
  }, [actions, filters]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setModalOpen(true); };
  const handleSave = (a) => {
    if (editing) onUpdate(a); else onAdd(a);
    setModalOpen(false);
    setEditing(null);
  };

  const selStyle = { borderColor: BRAND.border, color: BRAND.text };
  const sel = 'rounded-lg border px-2.5 py-1.5 text-xs font-medium outline-none';

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl p-3 shadow-sm" style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}>
        <input
          placeholder="Rechercher…"
          className="grow rounded-lg border px-3 py-1.5 text-sm outline-none"
          style={selStyle}
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select className={sel} style={selStyle} value={filters.axis} onChange={(e) => setFilters((f) => ({ ...f, axis: e.target.value }))}>
          <option value="">Tous les axes</option>
          {config.axes.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className={sel} style={selStyle} value={filters.country} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}>
          <option value="">Tous les pays</option>
          {config.countries.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className={sel} style={selStyle} value={filters.entity} onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))}>
          <option value="">Toutes les entités</option>
          {config.entities.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className={sel} style={selStyle} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">Tous statuts</option>
          {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
        </select>
        <select className={sel} style={selStyle} value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">Toutes priorités</option>
          {Object.values(PRIORITIES).map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <button onClick={openNew} className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: BRAND.cobalt }}>
          + Nouvelle action
        </button>
      </div>

      <div className="text-xs font-medium" style={{ color: BRAND.textMuted }}>
        {filtered.length} action(s) affichée(s) sur {actions.length}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-sm" style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['Action', 'Axe', 'Pays / Entité', 'Resp.', 'Statut', 'Priorité', 'Avancement', 'Échéance', 'Budget', ''].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const overdue = isOverdue(a);
              return (
                <tr key={a.id} className="border-t" style={{ borderColor: BRAND.border }}>
                  <td className="max-w-xs px-3 py-2.5">
                    <div className="font-semibold" style={{ color: BRAND.ink }}>{a.title}</div>
                    {a.notes && <div className="truncate text-xs" style={{ color: BRAND.textMuted }}>{a.notes}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: BRAND.text }}>{a.axis}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: BRAND.text }}>
                    <div className="font-medium">{a.country}</div>
                    <div style={{ color: BRAND.textMuted }}>{a.entity}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: BRAND.text }}>{a.owner}</td>
                  <td className="px-3 py-2.5">
                    {/* inline status edit */}
                    <select
                      value={a.status}
                      onChange={(e) => onUpdate({ ...a, status: e.target.value, progress: e.target.value === 'done' ? 100 : a.progress })}
                      className="rounded-md border px-1.5 py-1 text-xs font-semibold outline-none"
                      style={{ borderColor: BRAND.border, color: STATUS[a.status]?.color }}
                    >
                      {STATUS_ORDER.map((k) => <option key={k} value={k} style={{ color: BRAND.text }}>{STATUS[k].label}</option>)}
                    </select>
                    {overdue && <span className="ml-1" title="Échéance dépassée">⏰</span>}
                  </td>
                  <td className="px-3 py-2.5"><PriorityDot priority={a.priority} /></td>
                  <td className="w-44 px-3 py-2.5">
                    {/* inline progress edit */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={a.progress}
                      onChange={(e) => onUpdate({ ...a, progress: Number(e.target.value) })}
                      className="w-full accent-blue-700"
                    />
                    <ProgressBar value={a.progress} color={overdue ? STATUS.at_risk.color : BRAND.cobalt} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: overdue ? STATUS.blocked.color : BRAND.text }}>
                    {a.endDate || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold tabular-nums" style={{ color: BRAND.text }}>
                    {fmtMoney(a.budget)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(a)} className="mr-1 text-xs font-semibold" style={{ color: BRAND.cobalt }}>Éditer</button>
                    <button
                      onClick={() => { if (window.confirm('Supprimer cette action ?')) onDelete(a.id); }}
                      className="text-xs font-semibold"
                      style={{ color: STATUS.blocked.color }}
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-sm" style={{ color: BRAND.textMuted }}>
                  Aucune action ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ActionModal
          action={editing}
          config={config}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Analyses tab
 * ------------------------------------------------------------------ */
const GROUP_DIMS = [
  { key: 'country', label: 'Pays' },
  { key: 'entity', label: 'Entité' },
  { key: 'axis', label: 'Axe' },
  { key: 'owner', label: 'Responsable' },
];

function Analyses({ actions }) {
  const [dim, setDim] = useState('country');

  const groups = useMemo(() => {
    const map = new Map();
    for (const a of actions) {
      const key = a[dim] || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        count: items.length,
        progress: Math.round(avg(items.map((x) => Number(x.progress || 0)))),
        budget: items.reduce((s, x) => s + Number(x.budget || 0), 0),
        done: items.filter((x) => x.status === 'done').length,
        blocked: items.filter((x) => x.status === 'blocked').length,
        atRisk: items.filter((x) => effectiveStatus(x) === 'at_risk').length,
        overdue: items.filter((x) => isOverdue(x)).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [actions, dim]);

  const attention = useMemo(() => {
    return actions
      .filter((a) => a.status === 'blocked' || isOverdue(a))
      .sort((a, b) => {
        const pr = (PRIORITIES[b.priority]?.rank || 0) - (PRIORITIES[a.priority]?.rank || 0);
        if (pr !== 0) return pr;
        return (a.endDate || '9999').localeCompare(b.endDate || '9999');
      });
  }, [actions]);

  return (
    <div className="space-y-5">
      <SectionCard
        title="Analyse croisée"
        subtitle="Synthèse par dimension : volume, avancement, budget et points de blocage."
        right={
          <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#F1F5F9' }}>
            {GROUP_DIMS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDim(d.key)}
                className="rounded-md px-3 py-1 text-xs font-semibold"
                style={dim === d.key ? { backgroundColor: BRAND.cobalt, color: '#fff' } : { color: BRAND.textMuted }}
              >
                {d.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {[GROUP_DIMS.find((d) => d.key === dim).label, 'Actions', 'Avancement', 'Terminées', 'À risque', 'Bloquées', 'En retard', 'Budget'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.key} className="border-t" style={{ borderColor: BRAND.border }}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: BRAND.ink }}>{g.key}</td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: BRAND.text }}>{g.count}</td>
                  <td className="w-48 px-3 py-2.5"><ProgressBar value={g.progress} /></td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: STATUS.done.color }}>{g.done}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: STATUS.at_risk.color }}>{g.atRisk}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: STATUS.blocked.color }}>{g.blocked}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: g.overdue ? STATUS.blocked.color : BRAND.textMuted }}>{g.overdue}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums font-semibold" style={{ color: BRAND.text }}>{fmtMoney(g.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Points d'attention"
        subtitle="Actions bloquées ou en retard, triées par priorité puis par échéance."
      >
        {attention.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: STATUS.done.color }}>
            ✓ Aucune action bloquée ou en retard. Plan sous contrôle.
          </div>
        ) : (
          <div className="space-y-2">
            {attention.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: '#F8FAFC', borderLeft: `4px solid ${a.status === 'blocked' ? STATUS.blocked.color : STATUS.at_risk.color}` }}
              >
                <div className="min-w-0 grow">
                  <div className="truncate font-semibold" style={{ color: BRAND.ink }}>{a.title}</div>
                  <div className="text-xs" style={{ color: BRAND.textMuted }}>
                    {a.axis} · {a.country} · {a.entity} · {a.owner}
                  </div>
                </div>
                <div className="hidden sm:block"><PriorityDot priority={a.priority} /></div>
                <StatusBadge status={a.status} overdue={isOverdue(a)} />
                <div className="w-16 text-right text-xs font-semibold tabular-nums" style={{ color: BRAND.text }}>{fmtPct(a.progress)}</div>
                <div className="w-24 text-right text-xs" style={{ color: isOverdue(a) ? STATUS.blocked.color : BRAND.textMuted }}>{a.endDate || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Settings tab
 * ------------------------------------------------------------------ */
function ReferentialEditor({ label, items, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.textMuted }}>{label}</div>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: '#EEF2FF', color: BRAND.ink }}>
            {it}
            <button onClick={() => onChange(items.filter((x) => x !== it))} className="font-bold" style={{ color: BRAND.textMuted }}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={`Ajouter…`}
          className="grow rounded-lg border px-3 py-1.5 text-sm outline-none"
          style={{ borderColor: BRAND.border, color: BRAND.text }}
        />
        <button onClick={add} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: BRAND.inkSoft }}>Ajouter</button>
      </div>
    </div>
  );
}

function Settings({ config, setConfig, actions, onReset }) {
  const [name, setName] = useState(config.planName);

  const updateRef = (key) => (items) => setConfig((c) => ({ ...c, [key]: items }));

  return (
    <div className="space-y-5">
      <SectionCard title="Plan" subtitle="Identité du plan d'action stratégique.">
        <label className="mb-1 block text-xs font-semibold" style={{ color: BRAND.textMuted }}>Nom du plan</label>
        <div className="flex gap-2">
          <input className="grow rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: BRAND.border, color: BRAND.text }} value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={() => setConfig((c) => ({ ...c, planName: name.trim() || c.planName }))} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BRAND.cobalt }}>
            Renommer
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Référentiels" subtitle="Gérer les axes, pays, entités et responsables disponibles dans le plan.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ReferentialEditor label="Axes stratégiques" items={config.axes} onChange={updateRef('axes')} />
          <ReferentialEditor label="Pays" items={config.countries} onChange={updateRef('countries')} />
          <ReferentialEditor label="Entités" items={config.entities} onChange={updateRef('entities')} />
          <ReferentialEditor label="Responsables" items={config.owners} onChange={updateRef('owners')} />
        </div>
      </SectionCard>

      <SectionCard title="Données" subtitle="Exporter le plan ou réinitialiser les données locales.">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadFile('pmo-plan.json', JSON.stringify({ config, actions }, null, 2), 'application/json')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: BRAND.ink }}
          >
            Exporter JSON
          </button>
          <button
            onClick={() => downloadFile('pmo-actions.csv', toCSV(actions), 'text/csv;charset=utf-8')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: BRAND.inkSoft }}
          >
            Exporter CSV
          </button>
          <button
            onClick={() => { if (window.confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) onReset(); }}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ color: STATUS.blocked.color, border: `1px solid ${STATUS.blocked.color}` }}
          >
            Réinitialiser les données
          </button>
        </div>
        <p className="mt-3 text-xs" style={{ color: BRAND.textMuted }}>
          Les données sont stockées localement dans votre navigateur (clé <code>{STORAGE_KEY}</code>). Aucune information ne quitte votre poste.
        </p>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Root component
 * ------------------------------------------------------------------ */
const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'plan', label: "Plan d'action" },
  { key: 'analyses', label: 'Analyses' },
  { key: 'settings', label: 'Paramètres' },
];

export default function PMOApp() {
  const [tab, setTab] = useState('dashboard');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [actions, setActions] = useState([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);

  // Hydrate from localStorage (or seed) on mount
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      setConfig({ ...DEFAULT_CONFIG, ...loaded.config });
      setActions(loaded.actions);
    } else {
      setConfig(DEFAULT_CONFIG);
      setActions(buildSeedActions());
    }
    setReady(true);
  }, []);

  // Debounced persistence
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState({ config, actions }), 400);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [config, actions, ready]);

  const addAction = (a) => setActions((prev) => [{ ...a }, ...prev]);
  const updateAction = (a) => setActions((prev) => prev.map((x) => (x.id === a.id ? { ...a } : x)));
  const deleteAction = (id) => setActions((prev) => prev.filter((x) => x.id !== id));
  const resetData = () => { setConfig(DEFAULT_CONFIG); setActions(buildSeedActions()); setTab('dashboard'); };

  if (!ready) {
    return <div className="flex h-full items-center justify-center" style={{ color: BRAND.textMuted }}>Chargement…</div>;
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* Header / control tower */}
      <header style={{ backgroundColor: BRAND.ink }}>
        <div className="mx-auto max-w-7xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-white" style={{ backgroundColor: BRAND.cobalt }}>
                PMO
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: BRAND.cobaltSoft }}>
                  Control Tower
                </div>
                <h1 className="text-lg font-extrabold leading-tight text-white">{config.planName}</h1>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>Périmètre</div>
              <div className="text-sm font-bold text-white">
                {config.countries.length} pays · {config.entities.length} entités · {actions.length} actions
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-4 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  tab === t.key
                    ? { backgroundColor: BRAND.surface, color: BRAND.ink }
                    : { color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.06)' }
                }
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-5 py-6">
        {tab === 'dashboard' && <Dashboard actions={actions} config={config} />}
        {tab === 'plan' && (
          <ActionPlan actions={actions} config={config} onAdd={addAction} onUpdate={updateAction} onDelete={deleteAction} />
        )}
        {tab === 'analyses' && <Analyses actions={actions} />}
        {tab === 'settings' && (
          <Settings config={config} setConfig={setConfig} actions={actions} onReset={resetData} />
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-5 pb-8 pt-2 text-center text-xs" style={{ color: BRAND.textMuted }}>
        PMO Control Tower · Données persistées localement · {CURRENCY} = milliers d'euros
      </footer>
    </div>
  );
}
