'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '@/components/ui/ThemeProvider';
import type { Project, TaskCounts } from '@/store/kanbanStore';

type Props = {
  projects: Project[];
  taskCounts: TaskCounts;
};

export function ProjectProgressChart({ projects, taskCounts }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const data = useMemo(() => {
    return projects
      .filter((p) => p.status !== 'inactive')
      .map((project) => {
        const counts = taskCounts[project.id];
        const total = counts?.total || 0;

        let done = 0;
        const cols = project.columns || [];
        cols.forEach((col) => {
          if (col.isDone) {
            done += (counts?.byColumn && counts.byColumn[col.id]) || 0;
          }
        });
        // Fallback for legacy
        if (done === 0 && cols.length > 0) {
          const legacyDoneCol = cols.find((c) =>
            /conclu[íi]do|done|finalizad[oa]/i.test(c.title)
          );
          if (legacyDoneCol) {
            done = (counts?.byColumn && counts.byColumn[legacyDoneCol.id]) || 0;
          }
        }

        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
          name: project.title.length > 18 ? project.title.slice(0, 16) + '…' : project.title,
          fullName: project.title,
          progress,
          done,
          total,
        };
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 8);
  }, [projects, taskCounts]);

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-[var(--muted-foreground)]">
        <p className="font-mono text-xs uppercase tracking-wider">Sem dados de progresso</p>
      </div>
    );
  }

  function getBarColor(progress: number) {
    if (progress >= 80) return isLight ? '#16a34a' : '#22c55e';
    if (progress >= 50) return isLight ? '#ca8a04' : '#eab308';
    if (progress >= 25) return isLight ? '#ea580c' : '#f97316';
    return isLight ? '#dc2626' : '#ef4444';
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: isLight ? '#64748b' : '#71717a' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: isLight ? '#475569' : '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          width={110}
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
          formatter={(value: unknown, _name: unknown, props: unknown) => {
            const v = Number(value);
            const p = props as { payload?: { done?: number; total?: number } };
            return [
              `${v}% (${p.payload?.done ?? 0}/${p.payload?.total ?? 0})`,
              'Progresso',
            ];
          }}
          labelFormatter={(label: unknown) => String(label ?? '')}
          cursor={{ fill: isLight ? 'rgba(132,204,22,0.06)' : 'rgba(169,239,47,0.04)' }}
        />
        <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={18} animationDuration={1200}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.progress)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
