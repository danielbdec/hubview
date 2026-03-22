'use client';

import { useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import { useTheme } from '@/components/ui/ThemeProvider';
import type { Project, TaskCounts } from '@/store/kanbanStore';

type Props = {
  projects: Project[];
  taskCounts: TaskCounts;
};

const COLORS_DARK = ['#A9EF2F', '#22c55e', '#06b6d4', '#3b82f6', '#eab308', '#f97316', '#ec4899', '#a855f7'];
const COLORS_LIGHT = ['#84CC16', '#16a34a', '#0891b2', '#2563eb', '#ca8a04', '#ea580c', '#db2777', '#7c3aed'];

export function CompletionRateChart({ projects, taskCounts }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const data = useMemo(() => {
    const colors = isLight ? COLORS_LIGHT : COLORS_DARK;

    return projects
      .filter((p) => p.status !== 'inactive')
      .map((project, idx) => {
        const counts = taskCounts[project.id];
        const total = counts?.total || 0;

        let done = 0;
        const cols = project.columns || [];
        cols.forEach((col) => {
          if (col.isDone) {
            done += (counts?.byColumn && counts.byColumn[col.id]) || 0;
          }
        });
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
          name: project.title,
          value: progress,
          fill: colors[idx % colors.length],
          done,
          total,
        };
      })
      .sort((a, b) => a.value - b.value)
      .slice(0, 6);
  }, [projects, taskCounts, isLight]);

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-[var(--muted-foreground)]">
        <p className="font-mono text-xs uppercase tracking-wider">Sem projetos para exibir</p>
      </div>
    );
  }

  const avgCompletion = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="25%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={0}
          barSize={10}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: isLight ? 'rgba(148,163,184,0.08)' : 'rgba(255,255,255,0.04)' }}
            dataKey="value"
            cornerRadius={6}
            animationDuration={1200}
            animationBegin={300}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ top: '-10%' }}>
        <span
          className="font-mono font-bold"
          style={{
            fontSize: '28px',
            color: isLight ? '#0f172a' : '#ededed',
          }}
        >
          {avgCompletion}%
        </span>
        <span
          className="font-mono uppercase tracking-[0.18em]"
          style={{
            fontSize: '8px',
            color: isLight ? '#64748b' : '#71717a',
          }}
        >
          Média Geral
        </span>
      </div>

      {/* Legend */}
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span
              className="font-mono truncate max-w-[80px]"
              style={{
                fontSize: '9px',
                color: isLight ? '#475569' : '#a1a1aa',
              }}
              title={`${entry.name}: ${entry.value}%`}
            >
              {entry.name.length > 12 ? entry.name.slice(0, 10) + '…' : entry.name}
            </span>
            <span
              className="font-mono font-bold"
              style={{
                fontSize: '9px',
                color: isLight ? '#0f172a' : '#ededed',
              }}
            >
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
