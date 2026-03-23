'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@/components/ui/ThemeProvider';
import type { Project, TaskCounts } from '@/store/kanbanStore';

type Props = {
  projects: Project[];
  taskCounts: TaskCounts;
};

const COLUMN_PALETTE: Record<string, { dark: string; light: string; label: string }> = {
  backlog: { dark: '#ef4444', light: '#dc2626', label: 'Backlog' },
  'in-progress': { dark: '#eab308', light: '#ca8a04', label: 'Em Progresso' },
  review: { dark: '#8b5cf6', light: '#7c3aed', label: 'Review' },
  done: { dark: '#10b981', light: '#059669', label: 'Concluído' },
};

export function TaskDistributionChart({ projects, taskCounts }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { data, columnKeys } = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status !== 'inactive').slice(0, 8);
    const allColumnIds = new Set<string>();

    const chartData = activeProjects.map((project) => {
      const counts = taskCounts[project.id];
      const entry: Record<string, string | number> = {
        name: project.title.length > 14 ? project.title.slice(0, 12) + '…' : project.title,
        fullName: project.title,
      };

      const cols = project.columns || [];
      cols.forEach((col) => {
        const colId = col.id;
        allColumnIds.add(colId);
        entry[colId] = (counts?.byColumn && counts.byColumn[colId]) || 0;
      });

      return entry;
    });

    return { data: chartData, columnKeys: Array.from(allColumnIds) };
  }, [projects, taskCounts]);

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-[var(--muted-foreground)]">
        <p className="font-mono text-xs uppercase tracking-wider">Sem dados de distribuição</p>
      </div>
    );
  }

  function getColor(colId: string, projectIndex?: number) {
    const palette = COLUMN_PALETTE[colId];
    if (palette) return isLight ? palette.light : palette.dark;

    const fallback = ['#06b6d4', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#14b8a6'];
    const idx = projectIndex ?? columnKeys.indexOf(colId);
    return fallback[idx % fallback.length];
  }

  function getLabel(colId: string, projects: Project[]): string {
    const palette = COLUMN_PALETTE[colId];
    if (palette) return palette.label;

    for (const p of projects) {
      const col = p.columns?.find((c) => c.id === colId);
      if (col) return col.title;
    }
    return colId;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isLight ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.06)'}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: isLight ? '#64748b' : '#71717a' }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: isLight ? '#64748b' : '#71717a' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(5,5,5,0.92)',
            border: `1px solid ${isLight ? 'rgba(148,163,184,0.2)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            boxShadow: isLight ? '0 20px 50px rgba(15,23,42,0.12)' : '0 20px 50px rgba(0,0,0,0.5)',
            padding: '12px 16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
          }}
          labelStyle={{ color: isLight ? '#0f172a' : '#ededed', fontWeight: 700, marginBottom: 4 }}
          cursor={{ fill: isLight ? 'rgba(132,204,22,0.06)' : 'rgba(169,239,47,0.04)' }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            paddingTop: '12px',
          }}
          formatter={(value: string) => (
            <span style={{ color: isLight ? '#475569' : '#a1a1aa', marginLeft: 2 }}>{value}</span>
          )}
        />
        {columnKeys.map((colId, i) => (
          <Bar
            key={colId}
            dataKey={colId}
            name={getLabel(colId, projects)}
            fill={getColor(colId, i)}
            radius={i === columnKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            stackId="stack"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
