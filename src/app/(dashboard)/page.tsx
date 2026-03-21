'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Clock,
  ArrowRight,
  Activity,
  Zap,
  BarChart3,
  Sparkles,
  Target,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/kanbanStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useHydrated } from '@/hooks/useHydrated';
import { DecodingText } from '@/components/auth/LoginEffects';
import Link from 'next/link';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const hydrated = useHydrated();
  const { projects, taskCounts, fetchProjects, isLoadingProjects } = useProjectStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isLight = theme === 'light';

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const user = useMemo<UserData | null>(() => {
    if (!hydrated) return null;
    const stored = localStorage.getItem('hubview_user');
    if (!stored) return null;

    try {
      return JSON.parse(stored) as UserData;
    } catch {
      return null;
    }
  }, [hydrated]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute aggregate stats from taskCounts
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status !== 'inactive');
    let totalTasks = 0;
    let completedTasks = 0;
    let highPriority = 0;
    let activeTasks = 0;

    activeProjects.forEach(p => {
      const counts = taskCounts[p.id];
      if (!counts) return;
      totalTasks += counts.total;
      highPriority += counts.byPriority?.high || 0;

      // Sum tasks from columns marked as isDone
      const projectColumns = p.columns || [];
      let done = 0;

      // If we have columns data, use isDone flag.
      // Fallback: if no column has isDone=true, assume last column is completion?
      // No, let's enforce explicitly marking done. But for immediate migration UX,
      // we could fallback. For now, strict isDone logic.
      projectColumns.forEach(col => {
        if (col.isDone) {
          done += (counts.byColumn && counts.byColumn[col.id]) || 0;
        }
      });
      // Fallback for legacy data if done remains 0 but there are columns
      if (done === 0 && projectColumns.length > 0) {
        // Check if any column is actually named "Concluído" or "Done" as a temporary auto-detect
        const legacyDoneCol = projectColumns.find(c => /conclu[íi]do|done|finalizad[oa]/i.test(c.title));
        if (legacyDoneCol) {
          done = (counts.byColumn && counts.byColumn[legacyDoneCol.id]) || 0;
        }
      }

      completedTasks += done;
      activeTasks += counts.total - done;
    });

    return {
      totalProjects: activeProjects.length,
      totalTasks,
      activeTasks,
      completedTasks,
      highPriority,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projects, taskCounts]);

  // Recent projects (most recently updated, up to 5)
  const recentProjects = useMemo(() => {
    return [...projects]
      .filter(p => p.status !== 'inactive')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);
  }, [projects]);

  const metrics = [
    {
      label: 'Projetos Ativos',
      value: hydrated ? stats.totalProjects.toString() : '-',
      subtitle: 'Em andamento',
      icon: FolderOpen,
      color: 'text-tech-green',
      lightColor: 'text-lime-700',
      lightChip: 'bg-lime-100 text-lime-700 border-lime-200',
      lightSurface: 'from-lime-200/45 via-white to-white',
      bgGlow: 'rgba(169, 239, 47, 0.06)',
    },
    {
      label: 'Tarefas Ativas',
      value: hydrated ? stats.activeTasks.toString() : '-',
      subtitle: `${stats.totalTasks} total`,
      icon: Activity,
      color: 'text-yellow-400',
      lightColor: 'text-amber-700',
      lightChip: 'bg-amber-100 text-amber-700 border-amber-200',
      lightSurface: 'from-amber-200/40 via-white to-white',
      bgGlow: 'rgba(250, 204, 21, 0.06)',
    },
    {
      label: 'Alta Prioridade',
      value: hydrated ? stats.highPriority.toString() : '-',
      subtitle: 'Exigem atenção',
      icon: AlertTriangle,
      color: 'text-rose-400',
      lightColor: 'text-rose-700',
      lightChip: 'bg-rose-100 text-rose-700 border-rose-200',
      lightSurface: 'from-rose-200/40 via-white to-white',
      bgGlow: 'rgba(251, 113, 133, 0.06)',
    },
    {
      label: 'Concluídas',
      value: hydrated ? stats.completedTasks.toString() : '-',
      subtitle: `${stats.completionRate}% taxa`,
      icon: CheckCircle,
      color: 'text-emerald-400',
      lightColor: 'text-emerald-700',
      lightChip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      lightSurface: 'from-emerald-200/40 via-white to-white',
      bgGlow: 'rgba(52, 211, 153, 0.06)',
    },
  ];

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative mx-auto max-w-[1400px] space-y-6 px-4 pb-2 sm:px-6 lg:px-8">
      {isLight && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] overflow-hidden">
          <div className="absolute -left-8 top-2 h-56 w-56 rounded-full bg-lime-300/18 blur-3xl" />
          <div className="absolute right-[12%] top-10 h-64 w-64 rounded-full bg-sky-200/22 blur-3xl" />
          <div className="absolute left-[38%] top-40 h-40 w-40 rounded-full bg-emerald-200/16 blur-3xl" />
        </div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative flex flex-col gap-5 overflow-hidden lg:flex-row lg:items-center lg:justify-between',
          isLight
            ? 'rounded-[28px] border border-[color:rgba(148,163,184,0.28)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,251,0.92))] px-4 py-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-6 sm:py-6 lg:px-7 lg:py-7'
            : ''
        )}
      >
        {isLight && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[32rem] bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.16),transparent_48%)]" />
            <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full border border-lime-200/70" />
            <div className="pointer-events-none absolute -right-3 bottom-6 h-20 w-20 rounded-full border border-sky-200/70" />
          </>
        )}

        <div className="flex items-start gap-4 sm:items-center sm:gap-5">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <div className={cn(
              'h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--primary)]/30 shadow-[0_0_25px_-5px_rgba(169,239,47,0.2)]',
              isLight && 'shadow-[0_16px_34px_rgba(132,204,22,0.18)]'
            )}>
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  <span className="text-xl font-bold font-mono text-[var(--primary)]">
                    {user ? getInitials(user.name) : '?'}
                  </span>
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-[var(--background)] bg-tech-green shadow-[0_0_8px_rgba(169,239,47,0.6)]',
              isLight && 'border-white'
            )} />
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[1.9rem] font-bold tracking-tight text-[var(--foreground)] sm:text-2xl"
            >
              {getGreeting()},{' '}
              <span className="text-[var(--primary)]">
                <DecodingText text={user?.name?.split(' ')[0] || 'Operador'} />
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]',
                isLight && 'max-w-xl text-[14px] text-slate-600 sm:text-[15px]'
              )}
            >
              {isLight
                ? 'Visão operacional do dia com foco em progresso, gargalos e ritmo de execução da equipe.'
                : 'Acompanhe o ritmo do time, priorize tarefas críticas e entre rapidamente nos projetos mais recentes.'}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-2 flex flex-wrap items-center gap-2.5"
            >
              <span className="text-[var(--muted-foreground)] font-mono text-xs uppercase tracking-wider">
                {formattedDate}
              </span>
              <span className="text-[var(--primary)] font-mono text-xs font-bold">
                {formattedTime}
              </span>
              {isLight && (
                <span className="inline-flex items-center gap-1 rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-lime-700">
                  <Sparkles size={10} />
                  Light Mode
                </span>
              )}
            </motion.div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          {isLight && (
            <div className="hidden xl:grid grid-cols-2 gap-3 mr-2">
              <div className="min-w-[148px] rounded-2xl border border-lime-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,247,241,0.92))] px-4 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">Projetos</span>
                <div className="mt-2 flex items-end justify-between">
                  <strong className="text-2xl font-black tracking-tight text-slate-950">{stats.totalProjects}</strong>
                  <span className="rounded-full bg-lime-100 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-lime-700">
                    ativos
                  </span>
                </div>
              </div>
              <div className="min-w-[148px] rounded-2xl border border-slate-200/80 bg-slate-950 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">Conclusão</span>
                <div className="mt-2 flex items-end justify-between">
                  <strong className="text-2xl font-black tracking-tight text-white">{stats.completionRate}%</strong>
                  <span className="rounded-full bg-lime-300/15 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-lime-300">
                    ritmo
                  </span>
                </div>
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden sm:block"
          >
            <Button variant="status" size="sm">
              <Zap size={12} />
              Sistema Online
            </Button>
          </motion.div>
          <Link href="/projects" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              <FolderOpen size={16} className="mr-2" /> Projetos
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              variant="default"
              className={cn(
                'relative h-full cursor-default overflow-hidden transition-all duration-300 hover:bg-[var(--card-hover)]',
                isLight && 'rounded-[24px] border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,248,252,0.9))] shadow-[0_18px_44px_rgba(15,23,42,0.08)] hover:-translate-y-1'
              )}
            >
              {/* Subtle glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: isLight
                    ? `linear-gradient(145deg, rgba(255,255,255,0.2), transparent 42%), radial-gradient(ellipse at center, ${metric.bgGlow.replace('0.06', '0.14')}, transparent 72%)`
                    : `radial-gradient(ellipse at center, ${metric.bgGlow}, transparent 70%)`
                }}
              />
              {isLight && (
                <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-80', metric.lightSurface)} />
              )}

              <div className="relative flex justify-between items-start mb-4">
                <div className={cn(
                  'p-2.5 bg-[var(--column-bg)]',
                  isLight ? metric.lightColor : metric.color,
                  isLight && 'rounded-2xl border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                )}>
                  <metric.icon size={20} />
                </div>
                <span className={cn(
                  'text-[10px] font-mono px-2 py-1 uppercase tracking-wider',
                  isLight ? `rounded-full border ${metric.lightChip}` : `bg-[var(--column-bg)] ${metric.color}`
                )}>
                  {metric.subtitle}
                </span>
              </div>
              <div className="relative">
                <h3 className={cn(
                  'mb-1 text-3xl font-bold font-mono text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]',
                  isLight && 'text-[2rem] tracking-[-0.06em] text-slate-950'
                )}>
                  {isLoadingProjects ? (
                    <div className="h-9 w-12 bg-[var(--card-hover)] animate-pulse" />
                  ) : (
                    metric.value
                  )}
                </h3>
                <p className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider font-mono">
                  {metric.label}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Panel */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card
            variant={isLight ? 'glass' : 'outline'}
            className={cn(
              'h-full',
              isLight && 'rounded-[28px] border-slate-200/80 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(246,248,252,0.94))] shadow-[0_26px_56px_rgba(15,23,42,0.1)]'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 bg-[var(--column-bg)] text-[var(--primary)]',
                  isLight && 'rounded-2xl border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                )}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono">
                    <DecodingText text="Projetos Recentes" />
                  </h3>
                  {isLight && (
                    <p className="mt-1 text-xs text-slate-500">Priorize entradas mais movimentadas e acompanhe o avanço por projeto.</p>
                  )}
                </div>
              </div>
              <Link href="/projects" className={cn(
                'flex items-center gap-1 text-xs font-mono text-[var(--primary)] hover:underline',
                isLight && 'rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 font-semibold uppercase tracking-[0.18em] no-underline hover:bg-lime-100'
              )}>
                Ver Todos <ArrowRight size={12} />
              </Link>
            </div>

            {isLoadingProjects ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-[var(--card-hover)] animate-pulse" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-mono text-sm">Nenhum projeto encontrado</p>
                <Link href="/projects">
                  <Button variant="primary" size="sm" className="mt-4">
                    Criar Primeiro Projeto
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project, i) => {
                  const counts = taskCounts[project.id];
                  const total = counts?.total || 0;


                  // Calculate done based on project columns
                  let done = 0;
                  const projCols = project.columns || [];
                  projCols.forEach(col => {
                    if (col.isDone) {
                      done += (counts?.byColumn && counts.byColumn[col.id]) || 0;
                    }
                  });
                  // Fallback for legacy
                  if (done === 0 && projCols.length > 0) {
                    const legacyDoneCol = projCols.find(c => /conclu[íi]do|done|finalizad[oa]/i.test(c.title));
                    if (legacyDoneCol) {
                      done = (counts?.byColumn && counts.byColumn[legacyDoneCol.id]) || 0;
                    }
                  }

                  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link href={`/projects/${project.id}`}>
                        <div className={cn(
                          'group flex cursor-pointer items-center gap-4 border border-transparent p-4 transition-all duration-200',
                          isLight
                            ? 'rounded-[22px] border-slate-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(241,247,243,0.9))] hover:-translate-y-0.5 hover:border-lime-200 hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,248,239,0.94))] hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]'
                            : 'bg-[var(--column-bg)] hover:bg-[var(--card-hover)] hover:border-[var(--card-border)]'
                        )}>
                          {/* Project Icon */}
                          <div className={cn(
                            'shrink-0 p-2 text-[var(--primary)] transition-colors',
                            isLight
                              ? 'rounded-2xl border border-lime-100 bg-lime-50 group-hover:bg-lime-100'
                              : 'bg-[var(--card-hover)] group-hover:bg-[var(--primary)]/10'
                          )}>
                            <FolderOpen size={18} />
                          </div>

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide truncate group-hover:text-[var(--primary)] transition-colors">
                              {project.title}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
                                {total} tarefas · {done} concluídas
                              </p>
                              {isLight && (
                                <span className="rounded-full border border-sky-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.9))] px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-slate-600">
                                  Atualizado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className={cn(
                              'hidden h-1.5 w-24 overflow-hidden sm:block',
                              isLight ? 'rounded-full bg-slate-200' : 'bg-[var(--card-hover)]'
                            )}>
                              <div
                                className="h-full bg-[var(--primary)] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-[var(--primary)] min-w-[36px] text-right">
                              {progress}%
                            </span>
                            <ArrowRight size={14} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Side Panel: Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Completion Rate Card */}
          <Card
            variant="glass"
            className={cn(
              'relative overflow-hidden',
              isLight && 'rounded-[28px] border-slate-200/80 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(246,248,252,0.94))] shadow-[0_24px_52px_rgba(15,23,42,0.1)]'
            )}
          >
            {isLight && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.18),transparent_72%)]" />
            )}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono">
                  <DecodingText text="Taxa de Conclusão" />
                </h3>
                {isLight && (
                  <p className="mt-1 text-xs text-slate-500">O quanto do pipeline ativo já virou entrega.</p>
                )}
              </div>
              <TrendingUp size={16} className="text-[var(--primary)]" />
            </div>

            <div className="flex items-end gap-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--card-hover)"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="butt"
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${stats.completionRate}, 100` }}
                    transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-mono text-[var(--foreground)]">
                    {hydrated ? `${stats.completionRate}%` : '-'}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 pb-1">
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)] uppercase">
                  <span>Concluídas</span>
                  <span className="text-emerald-400 font-bold">{stats.completedTasks}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)] uppercase">
                  <span>Em andamento</span>
                  <span className="text-yellow-400 font-bold">{stats.activeTasks}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)] uppercase">
                  <span>Total</span>
                  <span className="text-[var(--foreground)] font-bold">{stats.totalTasks}</span>
                </div>
              </div>
            </div>

            {isLight && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(145deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92))] px-3 py-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Eficiência</span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {stats.completionRate >= 70 ? 'Fluxo saudável' : 'Há espaço para acelerar'}
                  </p>
                </div>
                <div className="rounded-2xl border border-lime-200/70 bg-lime-50 px-3 py-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-lime-700">Foco</span>
                  <p className="mt-1 text-sm font-semibold text-lime-900">
                    {stats.highPriority} itens críticos
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions Card */}
          <Card
            variant="glass"
            className={cn(
              isLight && 'rounded-[28px] border-slate-200/80 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(246,248,252,0.94))] shadow-[0_24px_52px_rgba(15,23,42,0.1)]'
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono">
                  <DecodingText text="Ações Rápidas" />
                </h3>
                {isLight && (
                  <p className="mt-1 text-xs text-slate-500">Atalhos para os fluxos mais usados do dia.</p>
                )}
              </div>
              {isLight && <Target size={16} className="text-slate-400" />}
            </div>
            <div className="space-y-2">
              <Link href="/projects" className="w-full">
                <div className={cn(
                  'group flex cursor-pointer items-center gap-3 p-3 transition-colors',
                  isLight
                    ? 'rounded-2xl border border-lime-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(239,247,241,0.9))] hover:border-lime-300 hover:bg-[linear-gradient(145deg,rgba(246,253,232,0.96),rgba(255,255,255,0.9))]'
                    : 'bg-[var(--column-bg)] hover:bg-[var(--card-hover)]'
                )}>
                  <FolderOpen size={16} className="text-[var(--primary)] shrink-0" />
                  <span className="text-xs font-mono text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    Gerenciar Projetos
                  </span>
                  <ArrowRight size={12} className="text-[var(--muted-foreground)] ml-auto" />
                </div>
              </Link>
              <Link href="/settings" className="w-full">
                <div className={cn(
                  'group flex cursor-pointer items-center gap-3 p-3 transition-colors',
                  isLight
                    ? 'rounded-2xl border border-sky-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(239,246,252,0.9))] hover:border-sky-300 hover:bg-[linear-gradient(145deg,rgba(240,249,255,0.96),rgba(255,255,255,0.9))]'
                    : 'bg-[var(--column-bg)] hover:bg-[var(--card-hover)]'
                )}>
                  <Clock size={16} className="text-blue-400 shrink-0" />
                  <span className="text-xs font-mono text-[var(--foreground)] group-hover:text-blue-400 transition-colors">
                    Configurações
                  </span>
                  <ArrowRight size={12} className="text-[var(--muted-foreground)] ml-auto" />
                </div>
              </Link>
            </div>
          </Card>

          {/* System Status Footer */}
          <div className={cn(
            'border border-[var(--card-border)] px-3 py-2 bg-[var(--card)]/50',
            isLight && 'rounded-2xl border-lime-200/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(239,247,241,0.88))] shadow-[0_16px_32px_rgba(15,23,42,0.08)]'
          )}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-tech-green shadow-[0_0_6px_rgba(169,239,47,0.6)] animate-pulse" />
              <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
                <DecodingText text="STATUS:" /> <span className="text-tech-green font-bold"><DecodingText text="OPERACIONAL" /></span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
