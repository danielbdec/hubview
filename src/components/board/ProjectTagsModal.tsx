'use client';

import { useState } from 'react';
import { useProjectStore, Tag } from '@/store/kanbanStore';
import {
    Tags, X, Pencil, Trash2, Check,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import { getReadableTextColor } from '@/lib/color';

interface ProjectTagsModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];

export function ProjectTagsModal({ projectId, isOpen, onClose }: ProjectTagsModalProps) {
    const {
        projectTags,
        updateProjectTag,
        deleteProjectTag,
    } = useProjectStore();

    const tags = projectTags[projectId] || [];

    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<{ name: string; color: string }>({ name: '', color: '' });
    
    // Notification state
    const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
        isOpen: false, type: 'success', title: '', message: '',
    });
    const showNotification = (type: NotificationType, title: string, message: string) => {
        setNotification({ isOpen: true, type, title, message });
    };

    const handleSaveEdit = async () => {
        if (!editingTagId || !editFormData.name.trim()) return;
        try {
            await updateProjectTag(projectId, editingTagId, editFormData.name.trim(), editFormData.color);
            showNotification('success', 'Tag Atualizada', `A tag foi renomeada para ${editFormData.name.trim()}`);
            setEditingTagId(null);
        } catch {
            showNotification('error', 'Erro', 'Não foi possível atualizar a tag.');
        }
    };

    const handleDelete = async (tag: Tag) => {
        if (confirm(`Tem certeza que deseja excluir a tag "${tag.name}" permanentemente deste projeto?`)) {
            try {
                await deleteProjectTag(projectId, tag.id);
                showNotification('success', 'Tag Excluída', `Tag ${tag.name} deletada com sucesso.`);
            } catch {
                showNotification('error', 'Erro', 'Não foi possível apagar a tag.');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <NotificationToast
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification(n => ({ ...n, isOpen: false }))}
            />

            {/* Overlay */}
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-[color:var(--overlay-bg)] p-4 backdrop-blur-sm animate-in fade-in"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-lg border border-[var(--card-border)] bg-[var(--sidebar)] shadow-[var(--surface-shadow)] max-h-[85vh] flex flex-col"
                >
                    {/* Accent Line */}
                    <div className="absolute top-0 right-0 w-20 h-1 border-t-2 border-[var(--primary)]" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                                <Tags size={20} className="text-[var(--primary)]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-wider">
                                    Gerenciador de Tags
                                </h2>
                                <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">
                                    Dicionário Central
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tags List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                                {tags.length} {tags.length === 1 ? 'tag cadastrada' : 'tags cadastradas'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <AnimatePresence>
                                {tags.map((tag) => {
                                    const isEditing = editingTagId === tag.id;

                                    return (
                                        <motion.div
                                            key={tag.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={`group flex flex-col gap-2 p-3 border border-transparent hover:border-[var(--card-border)] hover:bg-[var(--card-hover)] transition-all bg-[var(--card)]/50`}
                                        >
                                            {isEditing ? (
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editFormData.name}
                                                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                                            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none font-mono"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                        />
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer border border-emerald-500/30"
                                                            title="Salvar"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTagId(null)}
                                                            className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer border border-rose-500/20"
                                                            title="Cancelar"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {PRESET_COLORS.map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => setEditFormData({ ...editFormData, color })}
                                                                className={`w-5 h-5 rounded-full transition-transform focus:outline-none ${editFormData.color === color ? 'ring-2 ring-offset-2 ring-[var(--foreground)] scale-110' : 'hover:scale-110 ring-2 ring-transparent hover:ring-[var(--foreground)]/30'}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="inline-flex items-center rounded-none px-2.5 py-1 text-[11px] font-mono font-bold tracking-[0.15em] uppercase"
                                                        style={{ backgroundColor: tag.color, color: getReadableTextColor(tag.color) }}
                                                    >
                                                        {tag.name}
                                                    </span>

                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTagId(tag.id);
                                                                setEditFormData({ name: tag.name, color: tag.color });
                                                            }}
                                                            className="p-1.5 text-[var(--muted-foreground)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                            title="Editar tag"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tag)}
                                                            className="p-1.5 text-[var(--muted-foreground)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                            title="Excluir tag do projeto"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {tags.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="p-3 bg-[var(--card-hover)] rounded-full mb-3">
                                        <AlertCircle size={24} className="text-[var(--muted-foreground)]" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                                        Nenhuma tag existente
                                    </h3>
                                    <p className="text-[11px] font-mono text-[var(--muted-foreground)] max-w-[250px]">
                                        Crie tags coloridas direto nos cartões das tarefas para preencher este dicionário.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-[var(--card-border)] flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-[10px] font-mono font-bold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
