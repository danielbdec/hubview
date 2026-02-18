'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, FolderOpen, LayoutGrid, Edit3, Power, Archive, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProjectStore, Project } from '@/store/kanbanStore';
import { motion, AnimatePresence } from 'framer-motion';
import EditProjectModal from '@/components/board/EditProjectModal';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import ConfirmModal from '@/components/ui/ConfirmModal';

type TabFilter = 'active' | 'inactive';

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, addProject, updateProjectAPI, inactivateProject, fetchProjects, fetchTaskCounts, taskCounts, isLoadingProjects } = useProjectStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [mounted, setMounted] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter tab
    const [activeTab, setActiveTab] = useState<TabFilter>('active');

    // Dropdown
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Edit Modal
    const [editProject, setEditProject] = useState<Project | null>(null);

    // Confirm Inactivate Modal
    const [inactivateTarget, setInactivateTarget] = useState<{ id: string; title: string } | null>(null);
    const [isInactivating, setIsInactivating] = useState(false);

    // Notification
    const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
        setNotification({ isOpen: true, type, title, message });
    }, []);

    // Filtered projects
    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            if (activeTab === 'active') return p.status !== 'inactive';
            return p.status === 'inactive';
        });
    }, [projects, activeTab]);

    const activeCount = useMemo(() => projects.filter(p => p.status !== 'inactive').length, [projects]);
    const inactiveCount = useMemo(() => projects.filter(p => p.status === 'inactive').length, [projects]);

    useEffect(() => {
        setMounted(true);
        fetchProjects();
    }, [fetchProjects]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateProject = async () => {
        if (!newProjectTitle.trim()) return;
        try {
            await addProject(newProjectTitle, newProjectDesc);
            setNewProjectTitle('');
            setNewProjectDesc('');
            setIsCreateModalOpen(false);
            showNotification('success', 'Projeto Criado', `"${newProjectTitle}" foi inicializado com sucesso.`);
        } catch {
            showNotification('error', 'Erro', 'Não foi possível criar o projeto.');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchProjects();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEditProject = async (id: string, updates: Partial<Project>) => {
        try {
            await updateProjectAPI(id, updates);
            await fetchProjects();
            showNotification('success', 'Projeto Atualizado', 'As alterações foram salvas com sucesso.');
        } catch {
            showNotification('error', 'Erro ao Atualizar', 'Não foi possível salvar as alterações.');
            throw new Error('update failed');
        }
    };

    const handleRequestInactivate = (e: React.MouseEvent, id: string, title: string) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        setInactivateTarget({ id, title });
    };

    const handleConfirmInactivate = async () => {
        if (!inactivateTarget) return;
        setIsInactivating(true);
        try {
            await inactivateProject(inactivateTarget.id);
            await fetchProjects();
            showNotification('warning', 'Projeto Arquivado', `"${inactivateTarget.title}" foi movido para inativos.`);
        } catch {
            showNotification('error', 'Erro ao Inativar', 'Não foi possível inativar o projeto.');
        } finally {
            setIsInactivating(false);
            setInactivateTarget(null);
        }
    };

    const handleOpenEdit = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        setEditProject(project);
    };

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    if (!mounted) return null;

    // Status badge config
    const statusBadge = (projectStatus?: string) => {
        switch (projectStatus) {
            case 'inactive':
                return { label: 'INATIVO', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
            case 'paused':
                return { label: 'PAUSADO', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
            default:
                return { label: 'ATIVO', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
        }
    };

    return (
        <div className="container mx-auto max-w-7xl py-8">
            {/* Notification Toast */}
            <NotificationToast
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification((n) => ({ ...n, isOpen: false }))}
            />

            {/* Edit Project Modal */}
            {editProject && (
                <EditProjectModal
                    project={editProject}
                    isOpen={!!editProject}
                    onClose={() => setEditProject(null)}
                    onSave={handleEditProject}
                />
            )}

            {/* Confirm Inactivate Modal */}
            <ConfirmModal
                isOpen={!!inactivateTarget}
                title="Inativar Projeto"
                message={`Tem certeza que deseja inativar "${inactivateTarget?.title}"? O projeto será arquivado e ficará disponível na aba Inativos.`}
                confirmLabel="Inativar"
                cancelLabel="Cancelar"
                variant="danger"
                isLoading={isInactivating}
                onConfirm={handleConfirmInactivate}
                onCancel={() => setInactivateTarget(null)}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-2">
                        Painel de Projetos
                    </h1>
                    <p className="text-[var(--muted-foreground)] font-mono text-sm">
                        Selecione um projeto para gerenciar suas tarefas e fluxos.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || isLoadingProjects}
                        className="p-2.5 border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200 disabled:opacity-50"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} disabled={isLoadingProjects}>
                        <Plus size={18} className="mr-2" /> Novo Projeto
                    </Button>
                </div>
            </div>

            {/* ═══ Filter Tabs ═══ */}
            <div className="flex items-center gap-1 mb-8 border-b border-[var(--card-border)]">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`
                        relative px-5 py-3 text-xs font-mono uppercase tracking-widest transition-all duration-200
                        ${activeTab === 'active'
                            ? 'text-[var(--primary)] font-bold'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <FolderOpen size={14} />
                        Ativos
                        <span className={`
                            inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-sm
                            ${activeTab === 'active'
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                : 'bg-[var(--card-hover)] text-[var(--muted-foreground)]'
                            }
                        `}>
                            {activeCount}
                        </span>
                    </span>
                    {activeTab === 'active' && (
                        <motion.div
                            layoutId="tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`
                        relative px-5 py-3 text-xs font-mono uppercase tracking-widest transition-all duration-200
                        ${activeTab === 'inactive'
                            ? 'text-rose-400 font-bold'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <Archive size={14} />
                        Inativos
                        <span className={`
                            inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-sm
                            ${activeTab === 'inactive'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-[var(--card-hover)] text-[var(--muted-foreground)]'
                            }
                        `}>
                            {inactiveCount}
                        </span>
                    </span>
                    {activeTab === 'inactive' && (
                        <motion.div
                            layoutId="tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-400"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                </button>
            </div>

            {isLoadingProjects ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                    <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando projetos...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--card-border)] rounded-lg bg-[var(--card)]/30"
                >
                    <div className="p-4 bg-[var(--card-hover)] rounded-full mb-4 ring-1 ring-[var(--primary)]/20">
                        {activeTab === 'active' ? (
                            <LayoutGrid size={40} className="text-[var(--primary)]" />
                        ) : (
                            <Archive size={40} className="text-[var(--muted-foreground)]" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                        {activeTab === 'active' ? 'Nenhum Projeto Ativo' : 'Nenhum Projeto Arquivado'}
                    </h3>
                    <p className="text-[var(--muted-foreground)] max-w-md text-center mb-8 font-mono text-sm">
                        {activeTab === 'active'
                            ? 'O sistema não detectou protocolos operacionais ativos. Inicialize um novo projeto para começar o rastreamento.'
                            : 'Projetos inativados aparecerão aqui como arquivo histórico.'
                        }
                    </p>
                    {activeTab === 'active' && (
                        <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={18} className="mr-2" /> Inicializar Primeiro Projeto
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredProjects.map((project) => {
                            const counts = taskCounts[project.id];
                            const totalTasks = counts?.total || 0;
                            const highPriority = counts?.byPriority?.high || 0;
                            // Sum all columns except first (backlog) for inProgress, last column for completed
                            const columnIds = Object.keys(counts?.byColumn || {});
                            const completedTasks = columnIds.length > 0
                                ? counts?.byColumn[columnIds[columnIds.length - 1]] || 0
                                : 0;
                            const inProgressTasks = totalTasks - completedTasks - (columnIds.length > 0 ? (counts?.byColumn[columnIds[0]] || 0) : 0);

                            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                            let taskStatus = 'PENDENTE';
                            let taskStatusColor = 'text-rose-500 border-rose-500';

                            if (totalTasks === 0) {
                                taskStatus = 'NOVO';
                                taskStatusColor = 'text-blue-400 border-blue-400';
                            } else if (progress === 100) {
                                taskStatus = 'CONCLUÍDO';
                                taskStatusColor = 'text-[var(--primary)] border-[var(--primary)]';
                            } else if (progress > 0) {
                                taskStatus = 'EM ANDAMENTO';
                                taskStatusColor = 'text-yellow-400 border-yellow-400';
                            }

                            // Sync Status Indicator
                            let syncIndicator = null;
                            if (project.syncStatus === 'syncing') {
                                syncIndicator = (
                                    <span className="relative flex h-3 w-3" title="Sincronizando...">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                    </span>
                                );
                            } else if (project.syncStatus === 'synced') {
                                syncIndicator = <span className="h-2 w-2 rounded-full bg-green-500" title="Sincronizado"></span>;
                            } else if (project.syncStatus === 'error') {
                                syncIndicator = <span className="h-2 w-2 rounded-full bg-red-500" title="Erro na sincronização"></span>;
                            }

                            const badge = statusBadge(project.status);
                            const isInactive = project.status === 'inactive';

                            return (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link href={isInactive ? '#' : `/projects/${project.id}`} className={isInactive ? 'pointer-events-none' : ''}>
                                        <div className={`group relative bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--card-hover)] p-6 h-full transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)] flex flex-col backdrop-blur-sm ${isInactive ? 'opacity-60' : ''}`}>
                                            {/* Tech corner accents */}
                                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />
                                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />

                                            {/* Header & Status */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-[var(--card-hover)] rounded-none">
                                                        <FolderOpen className="text-[var(--primary)]" size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1 uppercase tracking-wide">
                                                                {project.title}
                                                            </h3>
                                                            {syncIndicator}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">ID: {project.id.slice(0, 8)}</span>
                                                            {/* Status Badge */}
                                                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider border px-1.5 py-0.5 ${badge.className}`}>
                                                                {badge.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {!isInactive && (
                                                    <div className="relative" ref={openMenuId === project.id ? menuRef : null}>
                                                        <button
                                                            onClick={(e) => toggleMenu(e, project.id)}
                                                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 opacity-0 group-hover:opacity-100"
                                                            title="Opções"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {openMenuId === project.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="absolute right-0 top-8 z-50 w-48 bg-[var(--sidebar)] border border-[var(--card-border)] shadow-xl shadow-black/30"
                                                                >
                                                                    <button
                                                                        onClick={(e) => handleOpenEdit(e, project)}
                                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-mono text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                                                                    >
                                                                        <Edit3 size={14} className="text-[var(--primary)]" />
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleRequestInactivate(e, project.id, project.title)}
                                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-mono text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                                    >
                                                                        <Power size={14} />
                                                                        Inativar
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-[var(--muted-foreground)] text-sm mb-6 line-clamp-2 min-h-[40px]">
                                                {project.description || 'Sem descrição definida para este projeto.'}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="mb-6 space-y-2">
                                                <div className="flex justify-between text-xs font-mono uppercase tracking-wider">
                                                    <span className={`${taskStatusColor} border px-1.5 py-0.5 text-[10px] font-bold`}>{taskStatus}</span>
                                                    <span className="text-[var(--primary)] font-bold">{progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-[var(--card-hover)] overflow-hidden">
                                                    <div
                                                        className="h-full bg-[var(--primary)] transition-all duration-500 ease-out relative"
                                                        style={{ width: `${progress}%` }}
                                                    >
                                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-[var(--card-border)]">
                                                <div className="flex flex-col items-center p-2 bg-[var(--card-hover)]/30 hover:bg-[var(--card-hover)] transition-colors cursor-default">
                                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase">Total</span>
                                                    <span className="text-sm font-bold font-mono text-[var(--foreground)]">{totalTasks}</span>
                                                </div>
                                                <div className="flex flex-col items-center p-2 bg-[var(--card-hover)]/30 hover:bg-[var(--card-hover)] transition-colors cursor-default">
                                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase">Em And.</span>
                                                    <span className="text-sm font-bold font-mono text-yellow-500">{inProgressTasks}</span>
                                                </div>
                                                <div className="flex flex-col items-center p-2 bg-[var(--card-hover)]/30 hover:bg-[var(--card-hover)] transition-colors cursor-default">
                                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase">Feito</span>
                                                    <span className="text-sm font-bold font-mono text-[var(--primary)]">{completedTasks}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--sidebar)] border border-[var(--primary)] w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 uppercase tracking-wider">Novo Projeto</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1">NOME DO PROJETO</label>
                                <input
                                    type="text"
                                    value={newProjectTitle}
                                    onChange={(e) => setNewProjectTitle(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    placeholder="Ex: Marketing Campaign Q3"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1">DESCRIÇÃO</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors h-24 resize-none"
                                    placeholder="Objetivos e escopo..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleCreateProject}>
                                Criar Projeto
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
