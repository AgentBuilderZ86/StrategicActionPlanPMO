'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DimAgg } from '@/lib/aggregations';
import { COLORS } from '@/lib/constants';
import { fmtMoney } from '@/lib/utils';

const short = (s: string) => (s.length > 14 ? s.slice(0, 13) + '…' : s);

export function ComparAvancement({ data }: { data: DimAgg[] }) {
  const rows = data.map((d) => ({ label: short(d.label), full: d.label, avancement: d.avancementMoyen }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#586059' }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#586059' }} />
        <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ''} />
        <Bar dataKey="avancement" name="Avancement %" radius={[6, 6, 0, 0]} fill={COLORS.accent} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComparBudget({ data }: { data: DimAgg[] }) {
  const rows = data.map((d) => ({ label: short(d.label), full: d.label, budget: d.budget, conso: d.budgetConso }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 24, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#586059' }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fontSize: 11, fill: '#586059' }} />
        <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ''} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="budget" name="Budget" radius={[6, 6, 0, 0]} fill={COLORS.ink} />
        <Bar dataKey="conso" name="Consommé" radius={[6, 6, 0, 0]} fill={COLORS.ambre} />
      </BarChart>
    </ResponsiveContainer>
  );
}
