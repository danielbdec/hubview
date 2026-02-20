'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, CheckSquare, Plus, Eye, EyeOff, User, ChevronDown, Check, MessageSquare, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tabs, Spin } from 'antd';
import { PanelRightOpen, PanelRightClose, ChevronLeft, ChevronRight } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { Task, useProjectStore } from '@/store/kanbanStore';

type ChecklistItem = NonNullable<Task['checklist']>[number];

interface UserOption {
    id: string;
    name: string;
    avatar?: string;
}

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
    const [users, setUsers] = useState<UserOption[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [newActivityContent, setNewActivityContent] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { taskActivities, isLoadingActivities, fetchTaskActivities, addTaskActivity } = useProjectStore();
    const activities = task ? (taskActivities[task.id] || []) : [];

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch users list for assignee selector
    useEffect(() => {
        let isSubscribed = true;
        if (!isOpen) return;

        const fetchUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const res = await fetch('/api/users/list');
                const data = await res.json();
                if (isSubscribed && Array.isArray(data)) {
                    setUsers(data);
                }
            } catch (err) {
                console.error('Erro ao buscar usuários:', err);
            } finally {
                if (isSubscribed) setIsLoadingUsers(false);
            }
        };
        fetchUsers();

        return () => { isSubscribed = false; };
    }, [isOpen]);

    // Fetch Task Activities
    useEffect(() => {
        if (isOpen && task?.id) {
            fetchTaskActivities(task.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, task?.id]);

    useEffect(() => {
        if (task) {
            // Get logged-in user name from localStorage for default assignee
            let defaultAssignee = task.assignee || '';
            if (!defaultAssignee) {
                try {
                    const stored = localStorage.getItem('hubview_user');
                    if (stored) {
                        const user = JSON.parse(stored);
                        defaultAssignee = user.name || '';
                    }
                } catch { /* ignore */ }
            }

            // eslint-disable-next-line react-hooks/exhaustive-deps
            setFormData({
                content: task.content,
                description: task.description || '',
                tags: task.tags || [],
                priority: task.priority,
                assignee: defaultAssignee,
                startDate: task.startDate ? task.startDate.split('T')[0] : '',
                endDate: task.endDate ? task.endDate.split('T')[0] : '',
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
        const currentChecklist = formData.checklist || [];
        const newItem = {
            id: uuidv4(),
            text: newChecklistItem,
            completed: false,
            position: currentChecklist.length
        };
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

    const handleAddComment = async () => {
        if (!newActivityContent.trim() || !task) return;
        await addTaskActivity(task.id, 'comment', newActivityContent);
        setNewActivityContent('');
    };

    const checklistTotal = formData.checklist?.length || 0;
    const checklistCompleted = formData.checklist?.filter(i => i.completed).length || 0;
    const progress = checklistTotal === 0 ? 0 : Math.round((checklistCompleted / checklistTotal) * 100);

    const detalhesView = (
        <div className="space-y-6 pt-2 h-[60vh] overflow-y-auto px-6 pb-6 custom-scrollbar">
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Título</label>
                <Input
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    autoFocus
                    className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] rounded-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Responsável</label>
                <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none z-10" />
                    <select
                        value={formData.assignee || ''}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        className="w-full h-10 pl-9 pr-8 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors rounded-none appearance-none cursor-pointer [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="" className="bg-[#1a1a2e] text-white">Sem responsável</option>
                        {isLoadingUsers ? (
                            <option disabled className="bg-[#1a1a2e] text-zinc-400">Carregando...</option>
                        ) : (
                            users.map((u) => (
                                <option key={u.id} value={u.name} className="bg-[#1a1a2e] text-white">
                                    {u.name}
                                </option>
                            ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Descrição</label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-32 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none font-mono rounded-none"
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
                        <span className={cn(
                            "text-xs font-mono min-w-[40px] font-bold tracking-tight",
                            progress === 100 ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                        )}>
                            {progress}%
                        </span>
                        <div className="flex-1 h-3 bg-[var(--input-border)] rounded-none overflow-hidden border border-black/20">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 ease-out",
                                    progress === 100 ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]"
                                )}
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
                            <div key={item.id} className="flex items-start gap-3 group/item p-1 hover:bg-[var(--input-bg)]/50 transition-colors">
                                <button
                                    type="button"
                                    onClick={() => toggleChecklistItem(item.id)}
                                    className={cn(
                                        "mt-0.5 w-4 h-4 rounded-none border flex-shrink-0 flex items-center justify-center transition-none",
                                        item.completed
                                            ? "bg-[var(--primary)] border-[var(--primary)]"
                                            : "bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--primary)]/50"
                                    )}
                                >
                                    {item.completed && <Check size={12} className="text-black stroke-[3]" />}
                                </button>
                                <div className={cn(
                                    "flex-1 text-xs font-mono tracking-tight transition-none pt-0.5",
                                    item.completed ? "text-[var(--muted-foreground)] opacity-50 line-through" : "text-[var(--foreground)]"
                                )}>
                                    {item.text}
                                </div>
                                <button
                                    onClick={() => deleteChecklistItem(item.id)}
                                    className="text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 p-1 opacity-0 group-hover/item:opacity-100 transition-none"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Add Item Input */}
                <div className="flex mt-3 shadow-sm border border-[var(--input-border)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]">
                    <input
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                        placeholder="Adicionar nova subtarefa..."
                        className="flex-1 bg-[var(--input-bg)] border-none text-[var(--foreground)] h-10 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-[var(--muted-foreground)]/50"
                    />
                    <button
                        onClick={addChecklistItem}
                        disabled={!newChecklistItem.trim()}
                        className="px-4 bg-[var(--background)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-black border-l border-[var(--input-border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-mono text-xs uppercase tracking-wider"
                    >
                        <Plus size={16} className="mr-1.5" /> Adicionar
                    </button>
                </div>
            </div>

            {/* Dates Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Início Prevista</label>
                    <Input
                        type="date"
                        value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] text-sm [color-scheme:dark] dark:[color-scheme:dark]"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Finalização Prevista</label>
                    <Input
                        type="date"
                        value={formData.endDate ? formData.endDate.split('T')[0] : ''}
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
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border border-[var(--input-border)] bg-[var(--input-bg)]/30 rounded-none">
                        {formData.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-1 text-[10px] font-mono font-bold flex items-center gap-1 text-white border border-black/20 uppercase tracking-widest"
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
                    <div className="flex gap-2 items-center p-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-none">
                        <Input
                            placeholder="Nome da tag..."
                            className="border-none bg-[var(--input-bg)] h-8 focus:ring-0 px-0 text-sm w-full text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] rounded-none"
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
                    className="w-full h-10 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] px-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors rounded-none [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="low" className="bg-[#1a1a2e] text-white">BAIXA</option>
                    <option value="medium" className="bg-[#1a1a2e] text-white">MÉDIA</option>
                    <option value="high" className="bg-[#1a1a2e] text-white">ALTA</option>
                </select>
            </div>
        </div>
    );

    const atividadesView = (
        <div className="flex flex-col h-full bg-[var(--sidebar)] border-l border-[var(--sidebar-border)] w-[400px] shrink-0 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[var(--sidebar-border)] h-[81px] shrink-0 bg-[var(--background)]/50">
                <h3 className="text-sm font-bold font-mono tracking-widest text-[var(--foreground)] uppercase">
                    Histórico & Logs
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar">
                {isLoadingActivities ? (
                    <div className="flex justify-center items-center h-full"><Spin /></div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-[var(--muted-foreground)] text-xs font-mono py-8 h-full flex items-center justify-center">
                        Nenhuma atividade registrada na tarefa.
                    </div>
                ) : (
                    activities.map((act) => (
                        <div key={act.id} className="flex gap-3 text-sm font-mono group">
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "w-7 h-7 rounded-none flex items-center justify-center shrink-0 border transition-colors overflow-hidden",
                                    act.type === 'comment' || act.userName !== 'Sistema'
                                        ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                                        : "bg-[var(--input-bg)] text-[var(--muted-foreground)] border-[var(--sidebar-border)]"
                                )}>
                                    {act.userAvatar ? (
                                        <img
                                            src={act.userAvatar}
                                            alt={act.userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : act.type === 'comment' || act.userName !== 'Sistema' ? (
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(act.userName)}&background=22c55e&color=000000&rounded=false&bold=true&font-size=0.4`}
                                            alt={act.userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Activity size={12} />
                                    )}
                                </div>
                                <div className="w-[1px] h-full bg-[var(--sidebar-border)] my-1 group-last:hidden" />
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn(
                                        "font-bold",
                                        act.type === 'comment' ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                                    )}>
                                        {act.userName}
                                    </span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] opacity-70">
                                        {new Date(act.createdAt).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-none border",
                                    act.type === 'comment'
                                        ? "bg-[var(--input-bg)] border-[var(--input-border)] text-white"
                                        : "bg-transparent border-transparent text-[var(--muted-foreground)] text-xs -translate-x-3"
                                )}>
                                    {act.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="shrink-0 pt-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)]">
                <textarea
                    value={newActivityContent}
                    onChange={(e) => setNewActivityContent(e.target.value)}
                    placeholder="Adicione um comentário para a equipe..."
                    className="w-full h-20 bg-[var(--background)] border border-[var(--input-border)] text-[var(--foreground)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none font-mono rounded-none mb-3"
                />
                <Button
                    variant="primary"
                    className="w-full rounded-none font-mono tracking-widest text-xs h-10"
                    onClick={handleAddComment}
                    disabled={!newActivityContent.trim() || isLoadingActivities}
                >
                    <ArrowRight size={16} className="mr-2" /> ENVIAR COMENTÁRIO
                </Button>
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className={cn(
                "relative max-h-[90vh] overflow-hidden bg-[var(--sidebar)] border border-[var(--primary)]/40 shadow-[4px_4px_0_0_var(--primary)] flex animate-in zoom-in-95 duration-200 rounded-none transition-all duration-300 ease-out",
                isSidebarOpen ? "w-[1048px] max-w-[95vw]" : "w-[648px] max-w-full"
            )} onClick={(e) => e.stopPropagation()}>

                {/* Main Content Area (Fixed Width 600px) */}
                <div className="flex flex-col w-[600px] shrink-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] shrink-0 h-[81px]">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold font-mono tracking-wider text-[var(--foreground)] uppercase shadow-none tracking-widest truncate max-w-sm" title={task.content}>
                                {task.content || 'Editar Tarefa'}
                            </h2>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">ID: {task.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body - Details View */}
                    <div className="flex-1 bg-[var(--background)]">
                        {detalhesView}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)] shrink-0 h-[89px]">
                        <Button
                            variant="ghost"
                            className="text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 px-0 rounded-none font-mono"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} className="mr-2" /> EXCLUIR
                        </Button>

                        <div className="flex gap-3">
                            <Button variant="ghost" className="rounded-none font-mono tracking-widest text-[10px]" onClick={onClose}>CANCELAR</Button>
                            <Button variant="primary" className="rounded-none font-mono tracking-widest text-[10px]" onClick={handleSave}>
                                <Save size={16} className="mr-2" /> SALVAR ALTERAÇÕES
                            </Button>
                        </div>
                    </div>
                </div>

                {/* The Brutalist Vertical Pillar Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-12 shrink-0 border-l border-[var(--sidebar-border)] flex flex-col items-center justify-center gap-8 bg-[var(--background)] hover:bg-[var(--primary)] text-[var(--muted-foreground)] hover:text-black transition-colors group cursor-pointer z-20 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.5)]"
                    title={isSidebarOpen ? "Fechar Histórico" : "Ver Histórico & Logs"}
                >
                    <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
                        {isSidebarOpen ? (
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        ) : (
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        )}
                    </div>
                    <div className="flex items-center justify-center h-48 opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="font-mono text-[10px] tracking-widest uppercase -rotate-90 whitespace-nowrap">
                            Histórico & Logs
                        </span>
                    </div>
                </button>

                {/* Optional Sidebar */}
                {isSidebarOpen && atividadesView}

            </div>
        </div>,
        document.body
    );
}
