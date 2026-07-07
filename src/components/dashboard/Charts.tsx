'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DimAgg, TrendPoint } from '@/lib/aggregations';
import { STATUT_LABEL, STATUT_COLOR, COLORS, type Statut } from '@/lib/constants';
import { fmtMoney } from '@/lib/utils';

const short = (s: string) => (s.length > 16 ? s.slice(0, 15) + '…' : s);

export function AvancementParAxe({ data }: { data: DimAgg[] }) {
  const rows = data.map((d) => ({ ...d, label: d.label, court: short(d.label) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#586059' }} />
        <YAxis type="category" dataKey="court" width={120} tick={{ fontSize: 11, fill: '#161D17' }} />
        <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ''} />
        <Bar dataKey="avancementMoyen" name="Avancement" radius={[0, 6, 6, 0]} fill={COLORS.accent} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RepartitionStatuts({ data }: { data: { statut: string; count: number }[] }) {
  const rows = data.map((d) => ({
    name: STATUT_LABEL[d.statut as Statut] ?? d.statut,
    value: d.count,
    color: STATUT_COLOR[d.statut as Statut] ?? '#586059',
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {rows.map((r) => (
            <Cell key={r.name} fill={r.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AvancementParPays({ data }: { data: DimAgg[] }) {
  const rows = data.map((d) => ({ label: d.label, avancement: d.avancementMoyen, actions: d.count }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#586059' }} interval={0} angle={-15} textAnchor="end" height={56} />
        <YAxis yAxisId="l" domain={[0, 100]} tick={{ fontSize: 11, fill: '#586059' }} />
        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#586059' }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="l" dataKey="avancement" name="Avancement %" radius={[6, 6, 0, 0]} fill={COLORS.accent} />
        <Bar yAxisId="r" dataKey="actions" name="Nb actions" radius={[6, 6, 0, 0]} fill={COLORS.ink} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TendanceAvancement({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#586059' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#586059' }} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Line type="monotone" dataKey="avancement" name="Avancement global" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BudgetParAxe({ data }: { data: DimAgg[] }) {
  const rows = data.map((d) => ({ label: short(d.label), full: d.label, budget: d.budget, conso: d.budgetConso }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#586059' }} interval={0} angle={-15} textAnchor="end" height={56} />
        <YAxis tick={{ fontSize: 11, fill: '#586059' }} />
        <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ''} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="budget" name="Budget" radius={[6, 6, 0, 0]} fill={COLORS.ink} />
        <Bar dataKey="conso" name="Consommé" radius={[6, 6, 0, 0]} fill={COLORS.ambre} />
      </BarChart>
    </ResponsiveContainer>
  );
}
