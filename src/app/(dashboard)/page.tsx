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
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/kanbanStore';
import Link from 'next/link';
import Image from 'next/image';

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
  const { projects, taskCounts, fetchProjects, isLoadingProjects } = useProjectStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('hubview_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    fetchProjects();
  }, [fetchProjects]);

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
      value: mounted ? stats.totalProjects.toString() : '-',
      subtitle: 'Em andamento',
      icon: FolderOpen,
      color: 'text-tech-green',
      bgGlow: 'rgba(169, 239, 47, 0.06)',
    },
    {
      label: 'Tarefas Ativas',
      value: mounted ? stats.activeTasks.toString() : '-',
      subtitle: `${stats.totalTasks} total`,
      icon: Activity,
      color: 'text-yellow-400',
      bgGlow: 'rgba(250, 204, 21, 0.06)',
    },
    {
      label: 'Alta Prioridade',
      value: mounted ? stats.highPriority.toString() : '-',
      subtitle: 'Exigem atenção',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgGlow: 'rgba(251, 113, 133, 0.06)',
    },
    {
      label: 'Concluídas',
      value: mounted ? stats.completedTasks.toString() : '-',
      subtitle: `${stats.completionRate}% taxa`,
      icon: CheckCircle,
      color: 'text-emerald-400',
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
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--primary)]/30 shadow-[0_0_25px_-5px_rgba(169,239,47,0.2)]">
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
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-tech-green rounded-full border-[3px] border-[var(--background)] shadow-[0_0_8px_rgba(169,239,47,0.6)]" />
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold text-[var(--foreground)] tracking-tight"
            >
              {getGreeting()},{' '}
              <span className="text-[var(--primary)]">
                {user?.name?.split(' ')[0] || 'Operador'}
              </span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 mt-1"
            >
              <span className="text-[var(--muted-foreground)] font-mono text-xs uppercase tracking-wider">
                {formattedDate}
              </span>
              <span className="text-[var(--primary)] font-mono text-xs font-bold">
                {formattedTime}
              </span>
            </motion.div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-tech-green/10 border border-tech-green/20"
          >
            <Zap size={12} className="text-tech-green" />
            <span className="text-[10px] font-mono font-bold text-tech-green uppercase tracking-wider">
              Sistema Online
            </span>
          </motion.div>
          <Link href="/projects">
            <Button variant="primary" size="md">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <Card variant="default" className="h-full group cursor-default hover:bg-[var(--card-hover)] transition-all duration-300 relative overflow-hidden">
              {/* Subtle glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${metric.bgGlow}, transparent 70%)` }}
              />

              <div className="relative flex justify-between items-start mb-4">
                <div className={`p-2.5 bg-[var(--column-bg)] ${metric.color}`}>
                  <metric.icon size={20} />
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 bg-[var(--column-bg)] ${metric.color} uppercase tracking-wider`}>
                  {metric.subtitle}
                </span>
              </div>
              <div className="relative">
                <h3 className="text-3xl font-bold font-mono text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card variant="outline" className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--column-bg)] text-[var(--primary)]">
                  <BarChart3 size={18} />
                </div>
                <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono">
                  Projetos Recentes
                </h3>
              </div>
              <Link href="/projects" className="text-xs font-mono text-[var(--primary)] hover:underline flex items-center gap-1">
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    >
                      <Link href={`/projects/${project.id}`}>
                        <div className="group flex items-center gap-4 p-4 bg-[var(--column-bg)] hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--card-border)] transition-all duration-200 cursor-pointer">
                          {/* Project Icon */}
                          <div className="p-2 bg-[var(--card-hover)] text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors shrink-0">
                            <FolderOpen size={18} />
                          </div>

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide truncate group-hover:text-[var(--primary)] transition-colors">
                              {project.title}
                            </h4>
                            <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">
                              {total} tarefas · {done} concluídas
                            </p>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 bg-[var(--card-hover)] overflow-hidden hidden sm:block">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* Completion Rate Card */}
          <Card variant="glass" className="relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono">
                Taxa de Conclusão
              </h3>
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
                    {mounted ? `${stats.completionRate}%` : '-'}
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
          </Card>

          {/* Quick Actions Card */}
          <Card variant="glass">
            <h3 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-wider font-mono mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              <Link href="/projects" className="w-full">
                <div className="flex items-center gap-3 p-3 bg-[var(--column-bg)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer group">
                  <FolderOpen size={16} className="text-[var(--primary)] shrink-0" />
                  <span className="text-xs font-mono text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    Gerenciar Projetos
                  </span>
                  <ArrowRight size={12} className="text-[var(--muted-foreground)] ml-auto" />
                </div>
              </Link>
              <Link href="/settings" className="w-full">
                <div className="flex items-center gap-3 p-3 bg-[var(--column-bg)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer group">
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
          <div className="px-3 py-2 border border-[var(--card-border)] bg-[var(--card)]/50">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-tech-green shadow-[0_0_6px_rgba(169,239,47,0.6)] animate-pulse" />
              <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
                STATUS: <span className="text-tech-green font-bold">OPERACIONAL</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
