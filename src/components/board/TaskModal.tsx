'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, User, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/components/ui/ThemeProvider';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getReadableTextColor } from '@/lib/color';
import { message } from 'antd';
import { TaskChecklist, type ChecklistItem } from './TaskChecklist';
import { TaskActivitySidebar } from './TaskActivitySidebar';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { Task, useProjectStore } from '@/store/kanbanStore';

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
    const { theme: themeMode } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState<Partial<Task>>({});
    const [users, setUsers] = useState<UserOption[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { taskActivities, isLoadingActivities, fetchTaskActivities, addTaskActivity } = useProjectStore();
    const activities = task ? (taskActivities[task.id] || []) : [];
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

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

    const handleAddComment = async (content: string) => {
        await addTaskActivity(task.id, 'comment', content);
    };

    const handleChecklistChange = (checklist: ChecklistItem[]) => {
        setFormData({ ...formData, checklist });
    };

    const handleGenerateAi = async () => {
        if (!task || !formData.content) return;
        setIsGeneratingAi(true);
        try {
            const { api } = await import('@/lib/api');
            const response = await api.post<any>('/api/tasks/ai-breakdown', { 
                taskId: task.id, 
                context: `Título: ${formData.content}\nDescrição: ${formData.description || ''}` 
            });
            
            let aiChecklist = Array.isArray(response) ? response : (response?.checklist || []);

            // Fallback robusto para quando o n8n devolve a string crua do OpenAI Wrapper
            if (aiChecklist.length === 1 && aiChecklist[0]?.message?.content) {
                try {
                    const parsedContent = JSON.parse(aiChecklist[0].message.content);
                    if (parsedContent.checklist && Array.isArray(parsedContent.checklist)) {
                        aiChecklist = parsedContent.checklist;
                    }
                } catch (e) {
                    console.warn('[Modal] N8N Raw OpenAI fallback failed:', e);
                }
            }
            
            if (aiChecklist.length > 0) {
                const formattedAiChecklist = aiChecklist.map((item: any) => ({
                    id: crypto.randomUUID(),
                    text: item.text || item.content || item.title || 'Nova Tarefa',
                    completed: false
                }));
                // Adiciona localmente para aprovação do usuário antes de salvar
                setFormData(prev => ({
                    ...prev,
                    checklist: [...(prev.checklist || []), ...formattedAiChecklist]
                }));
                message.success(`${formattedAiChecklist.length} sub-tarefas geradas com IA!`);
            } else {
                message.warning("A IA não retornou nenhuma sub-tarefa. Tente detalhar mais a descrição.");
            }
        } catch (error) {
            console.error('Falha na requisição de IA:', error);
            message.error("Ocorreu um erro de conexão com a IA.");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const detalhesView = (
        <div className="space-y-6 pt-2 flex-1 overflow-y-auto px-4 sm:px-6 pb-6 custom-scrollbar">
            {/* Título */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Título</label>
                <Input
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    autoFocus
                    className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] focus:border-[var(--primary)] rounded-none"
                />
            </div>

            {/* Responsável */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Responsável</label>
                <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none z-10" />
                    <select
                        value={formData.assignee || ''}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        className="w-full h-10 cursor-pointer appearance-none rounded-none border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-8 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                        style={{ colorScheme: themeMode }}
                    >
                        <option value="">Sem responsável</option>
                        {isLoadingUsers ? (
                            <option disabled>Carregando...</option>
                        ) : (
                            users.map((u) => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                            ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Descrição</label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-32 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none font-mono rounded-none"
                    placeholder="Adicione detalhes sobre esta tarefa..."
                />
            </div>

            {/* Botão Mágico IA */}
            <div className="flex items-center justify-between mb-2 mt-4">
                <Button
                    variant="primary"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi || !formData.content}
                    className="w-full"
                >
                    {isGeneratingAi ? (
                        <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Processando Inteligência...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="fill-current animate-pulse mr-2" />
                            Detalhar Sub-tarefas com IA
                        </>
                    )}
                </Button>
            </div>

            {/* Checklist (componente extraído) */}
            <TaskChecklist
                checklist={formData.checklist || []}
                onChange={handleChecklistChange}
            />

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Início Prevista</label>
                    <Input
                        type="date"
                        value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] text-sm focus:border-[var(--primary)]"
                        style={{ colorScheme: themeMode }}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Data Finalização Prevista</label>
                    <Input
                        type="date"
                        value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] text-sm focus:border-[var(--primary)]"
                        style={{ colorScheme: themeMode }}
                    />
                </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Tags</label>

                {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border border-[var(--input-border)] bg-[var(--input-bg)]/30 rounded-none">
                        {formData.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="flex items-center gap-1 border border-black/10 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest"
                                style={{ backgroundColor: tag.color, color: getReadableTextColor(tag.color) }}
                            >
                                {tag.name}
                                <button
                                    onClick={() => setFormData({
                                        ...formData,
                                        tags: formData.tags?.filter(t => t.id !== tag.id)
                                    })}
                                    className="ml-1 transition-colors hover:opacity-70"
                                    title="Remover tag"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

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

            {/* Prioridade */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--primary)] uppercase tracking-wider">Prioridade</label>
                <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    className="h-10 w-full rounded-none border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                    style={{ colorScheme: themeMode }}
                >
                    <option value="low">BAIXA</option>
                    <option value="medium">MÉDIA</option>
                    <option value="high">ALTA</option>
                </select>
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[color:var(--overlay-bg)] p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn(
                "relative flex max-h-[90vh] overflow-hidden rounded-none border border-[var(--card-border)] bg-[var(--sidebar)] shadow-[var(--surface-shadow)] animate-in zoom-in-95 duration-200 transition-all duration-300 ease-out",
                "w-full h-full sm:w-auto sm:h-auto sm:max-h-[90vh] sm:rounded-none",
                isSidebarOpen ? "sm:w-[1048px] sm:max-w-[95vw]" : "sm:w-[648px] sm:max-w-full"
            )} onClick={(e) => e.stopPropagation()}>

                {/* Main Content Area */}
                <div className="flex flex-col w-full sm:w-[600px] shrink-0">
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] shrink-0">
                        <div className="flex flex-col min-w-0 flex-1 mr-4">
                            <h2 className="text-lg font-bold font-mono tracking-wider text-[var(--primary)] uppercase leading-snug" style={{ textShadow: '0 0 14px rgba(169,239,47,0.3)' }}>
                                {task.content || 'Editar Tarefa'}
                            </h2>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase mt-1">ID: {task.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 bg-[var(--background)]">
                        {detalhesView}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row items-center sm:justify-between p-4 sm:p-6 gap-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)] shrink-0">
                        <Button
                            variant="ghost"
                            className="theme-shine-rose text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 px-0 rounded-none font-mono"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} className="mr-2" /> EXCLUIR
                        </Button>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" className="theme-shine-amber rounded-none font-mono tracking-widest text-[10px] hover:text-yellow-400 hover:bg-yellow-400/10 focus:ring-yellow-400 flex-1 sm:flex-none" onClick={onClose}>CANCELAR</Button>
                            <Button variant="primary" className="rounded-none font-mono tracking-widest text-[10px] flex-1 sm:flex-none" onClick={handleSave}>
                                <Save size={16} className="mr-2" /> SALVAR ALTERAÇÕES
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Toggle Pillar (hidden on mobile) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden sm:flex w-12 shrink-0 border-l border-[var(--sidebar-border)] flex-col items-center justify-center gap-8 bg-[var(--background)] hover:bg-[var(--primary)] text-[var(--muted-foreground)] hover:text-black transition-colors group cursor-pointer z-20 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.5)]"
                    title={isSidebarOpen ? "Fechar Histórico" : "Ver Histórico & Logs"}
                >
                    <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
                        {isSidebarOpen ? (
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        ) : (
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                    </div>
                    <div className="flex items-center justify-center h-48 opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="font-mono text-[10px] tracking-widest uppercase -rotate-90 whitespace-nowrap">
                            Histórico & Logs
                        </span>
                    </div>
                </button>

                {/* Activity Sidebar (componente extraído) */}
                {isSidebarOpen && (
                    <TaskActivitySidebar
                        activities={activities}
                        isLoading={isLoadingActivities}
                        users={users}
                        onAddComment={handleAddComment}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}
