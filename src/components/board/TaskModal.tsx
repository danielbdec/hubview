'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, CheckSquare, Plus, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

import { Task } from '@/store/kanbanStore';

type ChecklistItem = NonNullable<Task['checklist']>[number];

interface TaskModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskId: string, updates: Partial<Task>) => void;
    onDelete: (taskId: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState<Partial<Task>>({});
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (task) {
            setFormData({
                content: task.content,
                description: task.description || '',
                tags: task.tags || [],
                priority: task.priority,
                assignee: task.assignee || '',
                startDate: task.startDate,
                endDate: task.endDate,
                checklist: task.checklist || [],
            });
        }
    }, [task]);

    if (!isOpen || !task || !mounted) return null;

    const handleSave = () => {
        onSave(task.id, formData);
        onClose();
    };

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            onDelete(task.id);
            onClose();
        }
    };

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        const newItem = { id: uuidv4(), text: newChecklistItem, completed: false };
        const currentChecklist = formData.checklist || [];
        setFormData({ ...formData, checklist: [...currentChecklist, newItem] });
        setNewChecklistItem('');
    };

    const toggleChecklistItem = (itemId: string) => {
        const currentChecklist = formData.checklist || [];
        const updatedChecklist = currentChecklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setFormData({ ...formData, checklist: updatedChecklist });
    };

    const deleteChecklistItem = (itemId: string) => {
        const currentChecklist = formData.checklist || [];
        setFormData({ ...formData, checklist: currentChecklist.filter(item => item.id !== itemId) });
    };

    const checklistTotal = formData.checklist?.length || 0;
    const checklistCompleted = formData.checklist?.filter(i => i.completed).length || 0;
    const progress = checklistTotal === 0 ? 0 : Math.round((checklistCompleted / checklistTotal) * 100);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--sidebar)] border border-[var(--primary)]/30 shadow-[0_0_50px_-12px_rgba(169,239,47,0.2)] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold font-mono tracking-wider text-[var(--foreground)]">EDITAR TAREFA</h2>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">ID: {task.id.slice(0, 8)}</span>
                    </div>
                    <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Título</label>
                        <Input
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            autoFocus
                            className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Responsável</label>
                        <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                            <Input
                                value={formData.assignee || ''}
                                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                className="pl-9 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] text-sm"
                                placeholder="Nome do responsável..."
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Descrição</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-32 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none font-sans"
                            placeholder="Adicione detalhes sobre esta tarefa..."
                        />
                    </div>

                    {/* Checklist Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--primary)]">
                                <CheckSquare size={16} />
                                <label className="text-xs font-mono uppercase tracking-wider">Checklist</label>
                            </div>
                            {checklistTotal > 0 && (
                                <button
                                    onClick={() => setHideCompleted(!hideCompleted)}
                                    className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1 transition-colors"
                                >
                                    {hideCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {hideCompleted ? 'Mostrar itens marcados' : 'Ocultar itens marcados'}
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {checklistTotal > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-mono text-[var(--muted-foreground)] min-w-[30px]">{progress}%</span>
                                <div className="flex-1 h-1.5 bg-[var(--input-border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* List Items */}
                        <div className="space-y-2">
                            {formData.checklist?.map((item) => {
                                if (hideCompleted && item.completed) return null;
                                return (
                                    <div key={item.id} className="flex items-start gap-3 group/item">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleChecklistItem(item.id)}
                                            className="mt-1 w-4 h-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--primary)] focus:ring-0 focus:ring-offset-0 checked:bg-[var(--primary)] checked:border-[var(--primary)] cursor-pointer transition-colors"
                                        />
                                        <div className={`flex-1 text-sm transition-colors ${item.completed ? 'text-[var(--muted-foreground)] line-through' : 'text-[var(--foreground)]'}`}>
                                            {item.text}
                                        </div>
                                        <button
                                            onClick={() => deleteChecklistItem(item.id)}
                                            className="text-[var(--muted-foreground)] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Item Input */}
                        <div className="flex gap-2 mt-2">
                            <Input
                                value={newChecklistItem}
                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                placeholder="Adicionar um item..."
                                className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] h-9 text-sm focus:border-[var(--primary)]"
                            />
                            <Button size="sm" variant="secondary" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
                                <Plus size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Dates Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Início Prevista</label>
                            <Input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] text-sm [color-scheme:dark] dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Finalização Prevista</label>
                            <Input
                                type="date"
                                value={formData.endDate || ''}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] text-sm [color-scheme:dark] dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Tag Management */}
                    <div className="space-y-3">
                        <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Tags</label>

                        {/* Existing Tags */}
                        {formData.tags && formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-[var(--input-border)] bg-[var(--input-bg)]/30 rounded-sm">
                                {formData.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1 text-white shadow-sm"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                        <button
                                            onClick={() => setFormData({
                                                ...formData,
                                                tags: formData.tags?.filter(t => t.id !== tag.id)
                                            })}
                                            className="hover:text-black/50 transition-colors ml-1"
                                            title="Remover tag"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Add New Tag */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Adicionar Nova Tag</label>
                            <div className="flex gap-2 items-center p-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-sm">
                                <Input
                                    placeholder="Nome da tag..."
                                    className="border-none bg-[var(--input-bg)] h-8 focus:ring-0 px-0 text-sm w-full text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                                    id="new-tag-input"
                                />
                                <div className="flex gap-1 shrink-0">
                                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'].map(color => (
                                        <button
                                            key={color}
                                            className="w-5 h-5 rounded-full hover:scale-110 transition-transform ring-2 ring-offset-1 ring-transparent hover:ring-[var(--foreground)]/20 focus:outline-none focus:ring-[var(--primary)]"
                                            style={{ backgroundColor: color }}
                                            title="Adicionar com esta cor"
                                            onClick={() => {
                                                const input = document.getElementById('new-tag-input') as HTMLInputElement;
                                                if (input.value.trim()) {
                                                    const newTag = {
                                                        id: uuidv4(),
                                                        name: input.value.trim(),
                                                        color: color
                                                    };
                                                    setFormData({
                                                        ...formData,
                                                        tags: [...(formData.tags || []), newTag]
                                                    });
                                                    input.value = '';
                                                    input.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Prioridade</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            className="w-full h-10 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] px-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none rounded-none"
                        >
                            <option value="low">BAIXA</option>
                            <option value="medium">MÉDIA</option>
                            <option value="high">ALTA</option>
                        </select>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)] sticky bottom-0 z-10 backdrop-blur-md">
                    <Button
                        variant="ghost"
                        className="text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 px-0"
                        onClick={handleDelete}
                    >
                        <Trash2 size={16} className="mr-2" /> Excluir
                    </Button>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave}>
                            <Save size={16} className="mr-2" /> Salvar Alterações
                        </Button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
