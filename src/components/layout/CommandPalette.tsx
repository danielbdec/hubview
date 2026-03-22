'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderOpen, FileText, LayoutDashboard, Settings, Users, X, Command, ArrowRight } from 'lucide-react';
import { useProjectStore } from '@/store/kanbanStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SearchResult = {
  id: string;
  type: 'project' | 'task' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  icon: 'project' | 'task' | 'page';
  meta?: string;
};

const STATIC_PAGES: SearchResult[] = [
  { id: 'page-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Painel principal com métricas e KPIs', href: '/', icon: 'page' },
  { id: 'page-projects', type: 'page', title: 'Projetos', subtitle: 'Lista de projetos e boards Kanban', href: '/projects', icon: 'page' },
  { id: 'page-settings', type: 'page', title: 'Configurações', subtitle: 'Perfil, tema e preferências', href: '/settings', icon: 'page' },
  { id: 'page-users', type: 'page', title: 'Usuários', subtitle: 'Gerenciar operadores e roles', href: '/users', icon: 'page' },
];

const ICON_MAP = {
  project: FolderOpen,
  task: FileText,
  page: LayoutDashboard,
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { projects, fetchProjects } = useProjectStore();

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Ensure projects are loaded for search
      if (projects.length === 0) fetchProjects();
      // Focus after animation
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen, projects.length, fetchProjects]);

  // Search logic
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show pages + recent projects when empty
      const recentProjects: SearchResult[] = projects
        .filter(p => p.status !== 'inactive')
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(p => ({
          id: `project-${p.id}`,
          type: 'project' as const,
          title: p.title,
          subtitle: p.description || 'Projeto Kanban',
          href: `/projects/${p.id}`,
          icon: 'project' as const,
        }));
      return [...STATIC_PAGES, ...recentProjects];
    }

    const matches: SearchResult[] = [];

    // Search pages
    STATIC_PAGES.forEach(page => {
      if (
        page.title.toLowerCase().includes(q) ||
        (page.subtitle && page.subtitle.toLowerCase().includes(q))
      ) {
        matches.push(page);
      }
    });

    // Search projects
    projects
      .filter(p => p.status !== 'inactive')
      .forEach(project => {
        const matchTitle = project.title.toLowerCase().includes(q);
        const matchDesc = project.description?.toLowerCase().includes(q);

        if (matchTitle || matchDesc) {
          matches.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.title,
            subtitle: project.description || 'Projeto Kanban',
            href: `/projects/${project.id}`,
            icon: 'project',
          });
        }

        // Search tasks within this project
        (project.columns || []).forEach(col => {
          (col.tasks || []).forEach(task => {
            const matchContent = task.content?.toLowerCase().includes(q);
            const matchTaskDesc = task.description?.toLowerCase().includes(q);
            const matchAssignee = task.assignee?.toLowerCase().includes(q);
            const matchTags = task.tags?.some(t => t.name.toLowerCase().includes(q));

            if (matchContent || matchTaskDesc || matchAssignee || matchTags) {
              matches.push({
                id: `task-${task.id}`,
                type: 'task',
                title: task.content,
                subtitle: `${project.title} › ${col.title}`,
                href: `/projects/${project.id}`,
                icon: 'task',
                meta: task.assignee || undefined,
              });
            }
          });
        });
      });

    return matches.slice(0, 20);
  }, [query, projects]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].href);
    }
  }, [results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Reset index on results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  function navigateTo(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Group results by type for display
  const grouped = useMemo(() => {
    const groups: { label: string; items: (SearchResult & { globalIndex: number })[] }[] = [];
    let globalIdx = 0;

    const pages = results.filter(r => r.type === 'page');
    const projectResults = results.filter(r => r.type === 'project');
    const tasks = results.filter(r => r.type === 'task');

    if (pages.length > 0) {
      groups.push({
        label: 'Páginas',
        items: pages.map(p => ({ ...p, globalIndex: globalIdx++ })),
      });
    }
    if (projectResults.length > 0) {
      groups.push({
        label: 'Projetos',
        items: projectResults.map(p => ({ ...p, globalIndex: globalIdx++ })),
      });
    }
    if (tasks.length > 0) {
      groups.push({
        label: 'Tarefas',
        items: tasks.map(t => ({ ...t, globalIndex: globalIdx++ })),
      });
    }

    return groups;
  }, [results]);

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Trigger Button for Header */}
      <button
        onClick={open}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-[var(--muted-foreground)] transition-all duration-200',
          'border border-[var(--card-border)] hover:border-[var(--primary)]/50',
          'hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]',
          isLight
            ? 'rounded-full bg-white/60 shadow-[0_4px_12px_rgba(15,23,42,0.06)]'
            : 'bg-[var(--card)]'
        )}
        title="Busca Global (⌘K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.2em]">
          Buscar
        </span>
        <kbd className={cn(
          'hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold',
          isLight
            ? 'rounded-md border border-slate-200 bg-slate-100 text-slate-500'
            : 'border border-[var(--card-border)] bg-[var(--column-bg)] text-[var(--muted-foreground)]'
        )}>
          <Command size={9} />K
        </kbd>
      </button>

      {/* Modal Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh]"
              onClick={close}
            >
              {/* Backdrop */}
              <div className={cn(
                'absolute inset-0',
                isLight
                  ? 'bg-slate-900/20 backdrop-blur-sm'
                  : 'bg-black/60 backdrop-blur-sm'
              )} />

              {/* Palette */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
                className={cn(
                  'relative w-full max-w-[580px] mx-4 overflow-hidden',
                  isLight
                    ? 'rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_40px_100px_rgba(15,23,42,0.25)]'
                    : 'border border-[var(--card-border)] bg-[var(--background)]/95 shadow-[0_40px_100px_rgba(0,0,0,0.7)]'
                )}
                style={{ backdropFilter: 'blur(24px)' }}
              >
                {/* Search Input */}
                <div className={cn(
                  'flex items-center gap-3 px-5 py-4 border-b',
                  isLight ? 'border-slate-200/60' : 'border-[var(--card-border)]'
                )}>
                  <Search size={18} className="text-[var(--primary)] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar projetos, tarefas, páginas..."
                    className={cn(
                      'flex-1 bg-transparent text-sm font-sans outline-none placeholder:text-[var(--muted-foreground)]',
                      isLight ? 'text-slate-900' : 'text-[var(--foreground)]'
                    )}
                  />
                  <button
                    onClick={close}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  className="max-h-[380px] overflow-y-auto py-2"
                >
                  {grouped.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Search size={32} className="mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
                      <p className="text-sm text-[var(--muted-foreground)] font-mono">
                        Nenhum resultado para &quot;{query}&quot;
                      </p>
                    </div>
                  ) : (
                    grouped.map(group => (
                      <div key={group.label}>
                        <div className={cn(
                          'px-5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.22em]',
                          isLight ? 'text-slate-400' : 'text-[var(--muted-foreground)]'
                        )}>
                          {group.label}
                        </div>
                        {group.items.map(item => {
                          const Icon = ICON_MAP[item.icon];
                          const isSelected = item.globalIndex === selectedIndex;

                          return (
                            <button
                              key={item.id}
                              data-index={item.globalIndex}
                              onClick={() => navigateTo(item.href)}
                              onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                              className={cn(
                                'flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100',
                                isSelected
                                  ? isLight
                                    ? 'bg-lime-50/80 text-slate-900'
                                    : 'bg-[var(--primary)]/8 text-[var(--foreground)]'
                                  : 'text-[var(--foreground)]',
                                'hover:bg-[var(--card-hover)]'
                              )}
                            >
                              <div className={cn(
                                'shrink-0 p-1.5',
                                isSelected
                                  ? 'text-[var(--primary)]'
                                  : 'text-[var(--muted-foreground)]'
                              )}>
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.title}
                                </p>
                                {item.subtitle && (
                                  <p className={cn(
                                    'text-[11px] truncate mt-0.5',
                                    isLight ? 'text-slate-500' : 'text-[var(--muted-foreground)]'
                                  )}>
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              {item.meta && (
                                <span className={cn(
                                  'shrink-0 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border',
                                  isLight
                                    ? 'border-slate-200 text-slate-500 bg-slate-50'
                                    : 'border-[var(--card-border)] text-[var(--muted-foreground)] bg-[var(--column-bg)]'
                                )}>
                                  {item.meta}
                                </span>
                              )}
                              {isSelected && (
                                <ArrowRight size={12} className="shrink-0 text-[var(--primary)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className={cn(
                  'flex items-center justify-between px-5 py-2.5 border-t text-[9px] font-mono uppercase tracking-[0.18em]',
                  isLight
                    ? 'border-slate-200/60 text-slate-400 bg-slate-50/60'
                    : 'border-[var(--card-border)] text-[var(--muted-foreground)] bg-[var(--column-bg)]/50'
                )}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="border border-current/30 px-1 py-0.5 font-bold">↑↓</kbd>
                      Navegar
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="border border-current/30 px-1 py-0.5 font-bold">↵</kbd>
                      Abrir
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="border border-current/30 px-1 py-0.5 font-bold">Esc</kbd>
                      Fechar
                    </span>
                  </div>
                  <span className="text-[var(--primary)] font-bold">{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
