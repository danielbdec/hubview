'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, FolderOpen, Clock, Activity, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/kanbanStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, addProject, deleteProject } = useProjectStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreateProject = () => {
        if (!newProjectTitle.trim()) return;
        const id = addProject(newProjectTitle, newProjectDesc);
        setNewProjectTitle('');
        setNewProjectDesc('');
        setIsCreateModalOpen(false);
        router.push(`/projects/${id}`);
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            deleteProject(id);
        }
    };

    if (!mounted) return null; // Avoid hydration mismatch

    return (
        <div className="container mx-auto max-w-7xl py-8">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-2">
                        Painel de Projetos
                    </h1>
                    <p className="text-[var(--muted-foreground)] font-mono text-sm">
                        Selecione um projeto para gerenciar suas tarefas e fluxos.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Novo Projeto
                </Button>
            </div>

            {projects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--card-border)] rounded-lg bg-[var(--card)]/30"
                >
                    <div className="p-4 bg-[var(--card-hover)] rounded-full mb-4 ring-1 ring-[var(--primary)]/20">
                        <LayoutGrid size={40} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">Nenhum Projeto Ativo</h3>
                    <p className="text-[var(--muted-foreground)] max-w-md text-center mb-8 font-mono text-sm">
                        O sistema não detectou protocolos operacionais ativos. Inicialize um novo projeto para começar o rastreamento.
                    </p>
                    <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} className="mr-2" /> Inicializar Primeiro Projeto
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {projects.map((project) => {
                            // Calculate metrics
                            const totalTasks = project.columns.reduce((acc, col) => acc + col.tasks.length, 0);
                            const completedTasks = project.columns.find(c => c.id === 'done')?.tasks.length || 0;
                            const inProgressTasks = (project.columns.find(c => c.id === 'in-progress')?.tasks.length || 0) +
                                (project.columns.find(c => c.id === 'review')?.tasks.length || 0);
                            const pendingTasks = project.columns.find(c => c.id === 'backlog')?.tasks.length || 0;

                            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                            // Determine Status
                            let status = 'PENDENTE';
                            let statusColor = 'text-rose-500 border-rose-500';

                            if (totalTasks === 0) {
                                status = 'NOVO';
                                statusColor = 'text-blue-400 border-blue-400';
                            } else if (progress === 100) {
                                status = 'CONCLUÍDO';
                                statusColor = 'text-[var(--primary)] border-[var(--primary)]';
                            } else if (progress > 0) {
                                status = 'EM ANDAMENTO';
                                statusColor = 'text-yellow-400 border-yellow-400';
                            }

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link href={`/projects/${project.id}`}>
                                        <div className="group relative bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--card-hover)] p-6 h-full transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)] flex flex-col backdrop-blur-sm">
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
                                                        <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1 uppercase tracking-wide">
                                                            {project.title}
                                                        </h3>
                                                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">ID: {project.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                                    className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                                    title="Excluir Projeto"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>

                                            {/* Description */}
                                            <p className="text-[var(--muted-foreground)] text-sm mb-6 line-clamp-2 min-h-[40px]">
                                                {project.description || 'Sem descrição definida para este projeto.'}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="mb-6 space-y-2">
                                                <div className="flex justify-between text-xs font-mono uppercase tracking-wider">
                                                    <span className={`${statusColor} border px-1.5 py-0.5 text-[10px] font-bold`}>{status}</span>
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
