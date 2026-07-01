'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KANBAN_LABEL, COLORS, type KanbanColonne } from '@/lib/constants';
import type { BurndownPoint } from '@/lib/agile';

export function VelocityChart({ data }: { data: { sprint: string; points: number }[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-xs text-slate-400">Aucun sprint.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" vertical={false} />
        <XAxis dataKey="sprint" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
        <Tooltip formatter={(v: number) => `${v} pts`} />
        <Bar dataKey="points" name="Points terminés" radius={[6, 6, 0, 0]} fill={COLORS.accent} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CFDChart({ data }: { data: { colonne: KanbanColonne; count: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: KANBAN_LABEL[d.colonne] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
        <Tooltip formatter={(v: number) => `${v} items`} />
        <Bar dataKey="count" name="Items" radius={[6, 6, 0, 0]} fill={COLORS.vert} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BurndownChart({ data }: { data: BurndownPoint[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-xs text-slate-400">Sprint sans dates ou sans points.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" />
        <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'jour', position: 'insideBottomRight', fontSize: 10, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
        <Tooltip formatter={(v: number) => `${v} pts`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="ideal" name="Idéal" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
        <Line type="monotone" dataKey="restant" name="Restant" stroke={COLORS.accent} strokeWidth={2} connectNulls dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
