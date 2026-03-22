'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@/components/ui/ThemeProvider';
import type { TaskCounts } from '@/store/kanbanStore';

type Props = {
  taskCounts: TaskCounts;
};

const PRIORITY_CONFIG = {
  high: { label: 'Alta', dark: '#f43f5e', light: '#e11d48' },
  medium: { label: 'Média', dark: '#eab308', light: '#ca8a04' },
  low: { label: 'Baixa', dark: '#22c55e', light: '#16a34a' },
};

export function PriorityBreakdownChart({ taskCounts }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const data = useMemo(() => {
    const totals: Record<string, number> = { high: 0, medium: 0, low: 0 };

    Object.values(taskCounts).forEach((counts) => {
      if (!counts?.byPriority) return;
      Object.entries(counts.byPriority).forEach(([key, val]) => {
        if (key in totals) totals[key] += val;
      });
    });

    return Object.entries(PRIORITY_CONFIG)
      .map(([key, cfg]) => ({
        name: cfg.label,
        value: totals[key] || 0,
        color: isLight ? cfg.light : cfg.dark,
        key,
      }))
      .filter((d) => d.value > 0);
  }, [taskCounts, isLight]);

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-[var(--muted-foreground)]">
        <p className="font-mono text-xs uppercase tracking-wider">Sem dados de prioridade</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
          animationBegin={200}
          animationDuration={1000}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
          ))}
        </Pie>
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
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value);
            return [
              `${v} tarefa${v !== 1 ? 's' : ''} (${Math.round((v / total) * 100)}%)`,
              String(name),
            ];
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          formatter={(value: string) => (
            <span style={{ color: isLight ? '#475569' : '#a1a1aa', marginLeft: 2 }}>{value}</span>
          )}
        />
        {/* Center label */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            fill: isLight ? '#0f172a' : '#ededed',
          }}
        >
          {total}
        </text>
        <text
          x="50%"
          y="57%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fill: isLight ? '#64748b' : '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          TAREFAS
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
