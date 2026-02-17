'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, CheckSquare, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

type ChecklistItem = { id: string; text: string; completed: boolean; };

type Task = {
    id: string;
    content: string;
    description?: string;
    tag: string;
    priority: 'low' | 'medium' | 'high';
    checklist?: ChecklistItem[];
};

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
                tag: task.tag,
                priority: task.priority,
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
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-tech-green/30 shadow-[0_0_50px_-12px_rgba(169,239,47,0.2)] flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold font-mono tracking-wider text-white">EDITAR TAREFA</h2>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">ID: {task.id.slice(0, 8)}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-tech-green uppercase tracking-wider">Título</label>
                        <Input
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            autoFocus
                            className="bg-black/50 border-white/20 focus:border-tech-green"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-tech-green uppercase tracking-wider">Descrição</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-32 bg-black/50 border border-white/20 text-white p-3 text-sm focus:outline-none focus:border-tech-green transition-colors resize-none font-sans"
                            placeholder="Adicione detalhes sobre esta tarefa..."
                        />
                    </div>

                    {/* Checklist Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-tech-green">
                                <CheckSquare size={16} />
                                <label className="text-xs font-mono uppercase tracking-wider">Checklist</label>
                            </div>
                            {checklistTotal > 0 && (
                                <button
                                    onClick={() => setHideCompleted(!hideCompleted)}
                                    className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
                                >
                                    {hideCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {hideCompleted ? 'Mostrar itens marcados' : 'Ocultar itens marcados'}
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {checklistTotal > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-mono text-gray-400 min-w-[30px]">{progress}%</span>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-tech-green transition-all duration-300 ease-out"
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
                                            className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-tech-green focus:ring-0 focus:ring-offset-0 checked:bg-tech-green checked:border-tech-green cursor-pointer transition-colors"
                                        />
                                        <div className={`flex-1 text-sm transition-colors ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                            {item.text}
                                        </div>
                                        <button
                                            onClick={() => deleteChecklistItem(item.id)}
                                            className="text-gray-600 hover:text-tech-red opacity-0 group-hover/item:opacity-100 transition-opacity"
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
                                className="bg-black/50 border-white/20 h-9 text-sm focus:border-tech-green"
                            />
                            <Button size="sm" variant="secondary" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
                                <Plus size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Row: Tag & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-tech-green uppercase tracking-wider">Tag</label>
                            <Input
                                value={formData.tag || ''}
                                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                className="bg-black/50 border-white/20 focus:border-tech-green"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-tech-green uppercase tracking-wider">Prioridade</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full h-10 bg-black/50 border border-white/20 text-white px-3 text-sm focus:outline-none focus:border-tech-green transition-colors appearance-none rounded-none"
                            >
                                <option value="low">BAIXA</option>
                                <option value="medium">MÉDIA</option>
                                <option value="high">ALTA</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5 sticky bottom-0 z-10 backdrop-blur-md">
                    <Button
                        variant="ghost"
                        className="text-gray-500 hover:text-tech-red hover:bg-tech-red/10 px-0"
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
