'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Project } from '@/store/kanbanStore';

interface EditProjectModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Project>) => Promise<void>;
}

export default function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState(project.status || 'active');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(project.title);
            setDescription(project.description || '');
            setStatus(project.status || 'active');
        }
    }, [isOpen, project]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSave(project.id, { title: title.trim(), description: description.trim(), status });
            onClose();
        } catch {
            // Error is handled by the store; modal stays open
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                    onKeyDown={handleKeyDown}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-[var(--sidebar)] border border-[var(--primary)] w-full max-w-lg relative shadow-2xl shadow-[var(--primary)]/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h2 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-wider">
                                Editar Projeto
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ID Badge */}
                        <div className="px-6 pt-2">
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--card-hover)] px-2 py-0.5">
                                ID: {project.id.slice(0, 12)}
                            </span>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1.5 uppercase tracking-wider">
                                    Nome do Projeto
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    placeholder="Nome do projeto"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1.5 uppercase tracking-wider">
                                    Descrição
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors h-24 resize-none"
                                    placeholder="Objetivos e escopo..."
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1.5 uppercase tracking-wider">
                                    Status
                                </label>
                                <div className="flex gap-3">
                                    {['active', 'paused', 'inactive'].map((s) => {
                                        const isActive = status === s;
                                        const labels: Record<string, string> = { active: 'Ativo', paused: 'Pausado', inactive: 'Inativo' };
                                        const colors: Record<string, string> = {
                                            active: isActive ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[var(--input-border)] text-[var(--muted-foreground)]',
                                            paused: isActive ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[var(--input-border)] text-[var(--muted-foreground)]',
                                            inactive: isActive ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-[var(--input-border)] text-[var(--muted-foreground)]',
                                        };
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setStatus(s)}
                                                className={`
                                                    flex-1 py-2.5 px-3 border text-xs font-mono uppercase tracking-wider
                                                    transition-all duration-200 hover:bg-[var(--card-hover)]
                                                    ${colors[s]}
                                                `}
                                            >
                                                {labels[s]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <Button variant="ghost" onClick={onClose} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving || !title.trim()}>
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Salvando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save size={14} /> Salvar Alterações
                                    </span>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
