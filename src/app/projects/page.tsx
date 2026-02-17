'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, FolderOpen, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/kanbanStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, addProject, deleteProject } = useProjectStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

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

    return (
        <div className="container mx-auto max-w-7xl py-8">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-white mb-2">
                        Painel de Projetos
                    </h1>
                    <p className="text-gray-400 font-mono text-sm">
                        Selecione um projeto para gerenciar suas tarefas e fluxos.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Novo Projeto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link href={`/projects/${project.id}`}>
                                <div className="group relative bg-[#0a0a0a] border border-white/10 hover:border-tech-green/50 p-6 h-full transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(169,239,47,0.1)]">
                                    {/* Tech corner accents */}
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-tech-green transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-tech-green transition-colors" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white/5 rounded-none group-hover:bg-tech-green/10 transition-colors">
                                            <FolderOpen className="text-tech-green" size={24} />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteProject(e, project.id)}
                                            className="text-gray-600 hover:text-white transition-colors p-1"
                                            title="Excluir Projeto"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-tech-green transition-colors line-clamp-1">
                                        {project.title}
                                    </h3>

                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                        {project.description || 'Sem descrição.'}
                                    </p>

                                    <div className="flex items-center justify-between text-xs font-mono text-gray-500 border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-1">
                                            <Activity size={12} />
                                            <span>{project.columns.reduce((acc, col) => acc + col.tasks.length, 0)} Tasks</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0a0a0a] border border-tech-green/30 w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Novo Projeto</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">NOME DO PROJETO</label>
                                <input
                                    type="text"
                                    value={newProjectTitle}
                                    onChange={(e) => setNewProjectTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-tech-green focus:outline-none transition-colors"
                                    placeholder="Ex: Marketing Campaign Q3"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">DESCRIÇÃO</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-tech-green focus:outline-none transition-colors h-24 resize-none"
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
