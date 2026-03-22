'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, RefreshCw, ArrowLeft, LayoutGrid, Search, Filter, AlertCircle, Users, Lock, Globe, BarChart2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { CompletionConfetti, type CompletionBurst } from '@/components/board/CompletionConfetti';
import { TaskModal } from '@/components/board/TaskModal';
import { createPortal } from 'react-dom';
import { useProjectStore, Task, Column } from '@/store/kanbanStore';
import { Input, Select, ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from '@/components/ui/ThemeProvider';
import { getReadableTextColor } from '@/lib/color';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

import { useHydrated } from '@/hooks/useHydrated';
import ProjectListView from './ProjectListView';
import ProjectCalendarView from './ProjectCalendarView';
import TimelineView from '@/components/board/TimelineView';
import { useSocketStore } from '@/store/socketStore';
import { LiveCursors } from '@/components/board/LiveCursors';
import { PresenceAvatars } from '@/components/board/PresenceAvatars';
import { getSlaStatus } from '@/lib/sla';
import { ProjectMembersModal } from '@/components/board/ProjectMembersModal';
import { ProjectTagsModal } from '@/components/board/ProjectTagsModal';
import { Tags } from 'lucide-react';

type EditingTask = Task & {
    _columnId?: string;
};

export default function KanbanBoardPage() {
    const { theme: themeMode } = useTheme();
    const mounted = useHydrated();
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const {
        projects,
        setActiveProject,
        addColumn,
        addTask,
        updateTask,
        deleteTask,
        moveColumn,
        moveTask,
        fetchProjects,
        fetchBoardData,
        isLoadingProjects,
        isLoadingBoard,
        activeView,
        canEditProject,
        projectTags,
    } = useProjectStore();

    const canEdit = canEditProject(projectId);

    const { connect: connectSocket, disconnect: disconnectSocket, sendCursorMove } = useSocketStore();

    const hasFetchedRef = useRef(false);
    const dragSourceColumnIdRef = useRef<string | null>(null);
    const celebrationBurstRef = useRef(0);

    // Fetch projects first (needed on browser reload), then board data
    useEffect(() => {
        if (!projectId) return;
        setActiveProject(projectId);

        if (projects.length === 0 && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchProjects().then(() => {
                fetchBoardData(projectId);
            });
        } else {
            fetchBoardData(projectId);
        }
    }, [fetchBoardData, fetchProjects, projectId, projects.length, setActiveProject]);

    const activeProject = projects.find(p => p.id === projectId);

    // Socket Connection
    useEffect(() => {
        if (!projectId || !activeProject) return;
        
        let currentUser = {
            id: `user_${Math.floor(Math.random() * 99999)}`,
            name: 'Usuário',
            color: '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
            avatar: null as string | null
        };

        try {
            const stored = localStorage.getItem('hubview_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                currentUser = {
                    id: parsed.id || currentUser.id,
                    name: parsed.name || parsed.email?.split('@')[0] || 'Usuário',
                    color: parsed.color || currentUser.color,
                    avatar: parsed.avatar || null
                };
            }
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
        }

        connectSocket(projectId, currentUser);

        return () => {
            disconnectSocket();
        };
    }, [projectId, activeProject?.id]);

    // Throttle cursor updates (every 50ms = 20fps for performance)
    const cursorTimerRef = useRef<NodeJS.Timeout | null>(null);
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!cursorTimerRef.current) {
            cursorTimerRef.current = setTimeout(() => {
                sendCursorMove({ x: e.clientX, y: e.clientY });
                cursorTimerRef.current = null;
            }, 50);
        }
    };

    // Redirect if invalid
    useEffect(() => {
        // Wait for hydration/store load. Persist usually loads fast but...
        // If projects is empty but loaded, we might redirect.
        // For simplicity, let's just assume if it's not found after a tick, redirect.
        // Actually, just showing "Not Found" is safer than redirect loop.
    }, [activeProject]);

    // Derived state from active project
    const columns = activeProject?.columns || [];
    const totalTasks = columns.reduce((sum, column) => sum + (column.tasks?.length || 0), 0);
    const completedColumns = columns.filter((column) => column.isDone === true).length;
    const completedTasks = columns.reduce((sum, column) => (
        column.isDone ? sum + (column.tasks?.length || 0) : sum
    ), 0);
    const overdueTasks = columns.reduce((sum, column) => (
        sum + (column.isDone ? 0 : (column.tasks?.filter(t => getSlaStatus(t.endDate) === 'overdue').length || 0))
    ), 0);

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [celebrationBurst, setCelebrationBurst] = useState<CompletionBurst | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        priority: [] as string[],
        assignees: [] as string[],
        tags: [] as string[],
        onlyOverdue: false
    });

    // Extract unique assignees and tags
    const { uniqueAssignees, uniqueTags } = (() => {
        const assignees = new Set<string>();
        const tagsMap = new Map<string, { id: string, name: string, color: string }>();

        columns.forEach(col => {
            col.tasks?.forEach(task => {
                if (task.assignee) assignees.add(task.assignee);
                if (task.tags) {
                    task.tags.forEach(tag => tagsMap.set(tag.id, tag));
                }
            });
        });

        return {
            uniqueAssignees: Array.from(assignees).sort(),
            uniqueTags: Array.from(tagsMap.values())
        };
    })();

    // Filter logic
    const filteredColumns = (() => {
        const hasFilters = filters.search || filters.priority.length > 0 || filters.assignees.length > 0 || filters.tags.length > 0 || filters.onlyOverdue;
        if (!hasFilters) return columns;

        const searchLower = (filters.search || '').toLowerCase();

        return columns.map(col => ({
            ...col,
            tasks: (col.tasks || []).filter(task => {
                const matchSearch = !searchLower ||
                    (task.content || '').toLowerCase().includes(searchLower) ||
                    (task.description || '').toLowerCase().includes(searchLower);

                const matchPriority = filters.priority.length === 0 || filters.priority.includes(task.priority);
                const matchAssignee = filters.assignees.length === 0 || (task.assignee && filters.assignees.includes(task.assignee));
                const matchTags = filters.tags.length === 0 || (task.tags && task.tags.some(tag => filters.tags.includes(tag.name)));
                const matchOverdue = !filters.onlyOverdue || (!col.isDone && getSlaStatus(task.endDate) === 'overdue');

                return matchSearch && matchPriority && matchAssignee && matchTags && matchOverdue;
            })
        }));
    })();

    const hasActiveFilters = !!(filters.search || filters.priority.length || filters.assignees.length || filters.tags.length || filters.onlyOverdue);
    const clearFilters = () => setFilters({ search: '', priority: [], assignees: [], tags: [], onlyOverdue: false });

    const columnIds = filteredColumns.map((col) => col.id);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findColumn(id: string | null) {
        if (!id) return null;
        if (columns.some(col => col.id === id)) {
            return columns.find(col => col.id === id) || null;
        }
        return columns.find((col) => col.tasks.some((task) => task.id === id)) || null;
    }

    // --- Dynamic Actions ---

    const handleRequestAddTask = (columnId: string) => {
        const newTask: Task = {
            id: 'temp',
            content: '',
            description: '',
            tags: [],
            priority: 'medium',
        };
        setEditingTask({ ...newTask, _columnId: columnId });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
        const isNew = taskId === 'temp';

        if (isNew) {
            const columnId = editingTask?._columnId;
            if (!columnId) return;

            const content = updates.content || 'Nova Tarefa';

            addTask(columnId, {
                content,
                description: updates.description,
                tags: updates.tags || [],
                priority: updates.priority || 'medium',
                checklist: updates.checklist,
                assignee: updates.assignee,
                startDate: updates.startDate,
                endDate: updates.endDate
            });

        } else {
            updateTask(taskId, updates);
        }
    };

    // --- Utilities ---



    const handleRefresh = () => {
        if (projectId) {
            fetchBoardData(projectId);
        }
    };

    const buildCelebrationBurst = (
        burstId: string,
        column: Column,
        fallbackRect?: { left: number; top: number; width: number; height: number }
    ): CompletionBurst | null => {
        if (typeof window === 'undefined') return null;

        const targetElement = document.querySelector<HTMLElement>(`[data-kanban-column-id="${column.id}"]`);
        const rect = targetElement?.getBoundingClientRect() || fallbackRect;

        const originX = rect
            ? rect.left + rect.width / 2
            : window.innerWidth * 0.72;

        const originY = rect
            ? Math.max(96, rect.top + Math.min(rect.height * 0.24, 110))
            : Math.min(window.innerHeight * 0.34, 240);

        return {
            id: burstId,
            originX,
            originY,
            accent: column.color || '#10b981',
        };
    };

    // --- Drag and Drop Handlers ---

    function handleDragStart(event: DragStartEvent) {
        if (activeView !== 'kanban') return;
        const { active } = event;
        const update = active.data.current;

        if (update?.type === 'Column') {
            dragSourceColumnIdRef.current = null;
            setActiveColumn(update.column);
            return;
        }

        if (update?.type === 'Task') {
            dragSourceColumnIdRef.current = findColumn(active.id as string)?.id || null;
            setActiveTask(update.task);
            return;
        }
    }

    function handleDragOver(event: DragOverEvent) {
        if (activeView !== 'kanban') return;
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        if (!isActiveTask) return;

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        if (!activeColumn || !overColumn) return;

        if (activeColumn !== overColumn) {
            moveTask(activeId, overId, activeColumn.id, overColumn.id);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        if (activeView !== 'kanban') return;
        const { active, over } = event;
        const sourceColumnId = dragSourceColumnIdRef.current;

        setActiveColumn(null);
        setActiveTask(null);
        dragSourceColumnIdRef.current = null;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const isActiveColumn = active.data.current?.type === 'Column';

        // Check for completion celebration BEFORE early return.
        // handleDragOver already moves the card across columns during drag,
        // so by the time handleDragEnd fires, activeId === overId can be true
        // even though the card crossed columns. We use sourceColumnId (captured
        // at drag start) to detect cross-column moves to a "done" column.
        if (!isActiveColumn && sourceColumnId) {
            const currentColumn = findColumn(activeId);
            const sourceColumn = columns.find(c => c.id === sourceColumnId) || null;

            if (
                currentColumn &&
                sourceColumn &&
                sourceColumn.id !== currentColumn.id &&
                sourceColumn.isDone !== true &&
                currentColumn.isDone === true
            ) {
                celebrationBurstRef.current += 1;
                const burst = buildCelebrationBurst(
                    `${currentColumn.id}-${celebrationBurstRef.current}`,
                    currentColumn,
                    over.rect
                );
                if (burst) {
                    setCelebrationBurst(burst);
                }
            }
        }

        if (activeId === overId) return;

        if (isActiveColumn) {
            moveColumn(activeId, overId);
        } else {
            const activeColumn = findColumn(activeId);
            const overColumn = findColumn(overId);

            if (activeColumn && overColumn) {
                moveTask(activeId, overId, activeColumn.id, overColumn.id);
            }
        }
    }

    function handleDragCancel() {
        dragSourceColumnIdRef.current = null;
        setActiveColumn(null);
        setActiveTask(null);
    }

    if (!mounted) return null;

    if (!activeProject) {
        // Still loading — show spinner instead of 'not found'
        if (isLoadingProjects || isLoadingBoard) {
            return (
                <LoadingState
                    className="h-full min-h-[28rem]"
                    eyebrow="Board Hydration"
                    title="Carregando projeto"
                    description="Reconstruindo colunas, tarefas e estado de arraste."
                />
            );
        }
        return (
            <div className="flex h-full flex-col items-center justify-center text-[var(--muted-foreground)]">
                <p>Projeto não encontrado.</p>
                <Button variant="ghost" onClick={() => router.push('/projects')} className="mt-4">
                    Voltar para Projetos
                </Button>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div
                className="flex flex-1 h-full min-h-0 flex-col px-1 sm:px-2 py-1 xl:px-2 xl:py-1 overflow-hidden"
                onPointerMove={handlePointerMove}
            >
                <LiveCursors />
                
                {/* Header & Control Bar Area */}
                <ConfigProvider
                    theme={{
                        algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                        token: {
                            colorBgContainer: 'transparent',
                            colorBorder: 'rgba(255,255,255,0.15)', // Trazendo um pouco de contraste para a borda
                            colorText: 'var(--foreground)',
                            colorTextPlaceholder: 'var(--foreground)', // Alterado para brilhar mais emvez de muted
                            borderRadius: 0,
                            fontFamily: 'var(--font-sans)',
                            colorPrimary: 'var(--primary)',
                            controlItemBgActive: 'var(--card-hover)',
                            colorBgElevated: 'var(--sidebar)',
                        },
                        components: {
                            Select: {
                                selectorBg: 'var(--input-bg)',
                                optionSelectedBg: 'var(--primary)',
                                optionSelectedColor: '#000000',
                                optionActiveBg: 'var(--card-hover)',
                            },
                            Segmented: {
                                itemSelectedBg: 'var(--primary)',
                                itemSelectedColor: '#000000',
                                trackBg: 'var(--input-bg)',
                                itemHoverBg: 'var(--card-hover)',
                                itemHoverColor: 'var(--foreground)',
                            }
                        }
                    }}
                >
                    <div className="mb-2 flex flex-col gap-2">
                        {/* Ultra-Compact Top Header */}
                        <div className="flex flex-col gap-2 px-2 py-1.5 xl:flex-row xl:items-center xl:justify-between border-b border-[var(--primary)]/15 bg-[var(--card)]/10">
                            {/* Left: Project Identity */}
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    onClick={() => router.push('/projects')}
                                    className="group/back flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                    title="Voltar aos Projetos"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-[13px] font-black uppercase leading-tight tracking-tight text-[var(--primary)] truncate max-w-[200px] sm:max-w-[350px]" title={activeProject.title}>
                                            {activeProject.title}
                                        </h1>
                                        <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider border ${
                                            activeProject.visibility === 'private'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                            {activeProject.visibility === 'private' ? 'Privado' : 'Público'}
                                        </span>
                                        <span className="hidden sm:inline-block px-1.5 py-0.5 text-[8px] font-mono border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">ATIVO</span>
                                        <PresenceAvatars />
                                    </div>
                                    <p className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[300px] sm:max-w-[450px] mt-0.5">
                                        <span className="font-mono opacity-50 mr-2">#{activeProject.id.slice(0, 8)}</span>
                                        {activeProject.description || "Gerencie suas tarefas neste painel"}
                                    </p>
                                </div>
                            </div>
                            {/* Right: Compact KPIs & Actions */}
                            <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 pb-1 xl:pb-0">
                                {/* Mini KPIs Hover Button */}
                                <div className="relative group cursor-help">
                                    <div className="flex h-[26px] items-center gap-1.5 rounded border border-[var(--card-border)] bg-[var(--background)]/80 px-2 shadow-sm transition-colors group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 text-[var(--muted-foreground)]">
                                        <BarChart2 size={11} />
                                        <span className="hidden text-[9px] font-mono uppercase tracking-wider sm:inline">Resumo</span>
                                        {overdueTasks > 0 && <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                                    </div>

                                    {/* Hover Card */}
                                    <div className="absolute right-0 top-full z-[100] mt-1.5 flex w-48 flex-col gap-1 rounded-md border border-[var(--card-border)] bg-[var(--sidebar)] p-2 shadow-xl transition-all duration-200 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                        <span className="mb-1 px-1 text-[8px] font-mono uppercase text-[var(--muted-foreground)]">Métricas do Projeto</span>
                                        
                                        <div className="flex items-center justify-between rounded bg-cyan-500/5 px-2 py-1 text-cyan-500">
                                            <div className="flex items-center gap-1.5">
                                                <LayoutGrid size={10} />
                                                <span className="text-[9px] font-mono uppercase opacity-80">Painéis</span>
                                            </div>
                                            <strong className="text-[11px] font-mono">{columns.length}</strong>
                                        </div>

                                        <div className="flex items-center justify-between rounded bg-emerald-500/5 px-2 py-1 text-emerald-500">
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 size={10} />
                                                <span className="text-[9px] font-mono uppercase opacity-80">Concluídas</span>
                                            </div>
                                            <strong className="text-[11px] font-mono">{completedTasks}</strong>
                                        </div>

                                        {overdueTasks > 0 && (
                                            <div className="flex items-center justify-between rounded bg-red-500/10 px-2 py-1 text-red-500 border border-red-500/20">
                                                <div className="flex items-center gap-1.5">
                                                    <AlertCircle size={10} />
                                                    <span className="text-[9px] font-mono uppercase opacity-80">Atraso</span>
                                                </div>
                                                <strong className="animate-pulse text-[11px] font-mono">{overdueTasks}</strong>
                                            </div>
                                        )}

                                        <div className="mt-1 flex items-center justify-between rounded bg-[var(--card)] px-2 py-1 border border-[var(--card-border)] text-[var(--foreground)]">
                                            <span className="text-[9px] font-mono uppercase opacity-80 text-purple-400">Total de Tarefas</span>
                                            <strong className="text-[11px] font-mono text-purple-400">{totalTasks}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                    <Button variant="ghost" size="sm" onClick={() => setIsMembersModalOpen(true)} className="h-[26px] px-2 text-[9px] font-mono border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 gap-1 rounded" title="Acessos">
                                        <Users size={11} /> <span className="hidden sm:inline">Acessos</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsTagsModalOpen(true)} className="h-[26px] px-2 text-[9px] font-mono border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 gap-1 rounded" title="Tags">
                                        <Tags size={11} /> <span className="hidden md:inline">Tags</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("h-[26px] px-2 text-[9px] font-mono border gap-1 rounded transition-colors", showFilters || hasActiveFilters ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted-foreground)]")} title="Filtros">
                                        <Filter size={11} /> <span className="hidden sm:inline">Filtros</span>
                                        {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-0.5 animate-pulse" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-[26px] w-[26px] p-0 border border-transparent hover:border-[var(--card-border)] rounded" title="Atualizar">
                                        <RefreshCw size={12} className={isLoadingBoard ? 'animate-spin text-[var(--primary)]' : 'text-[var(--muted-foreground)]'} />
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={addColumn} className="h-[26px] px-2.5 text-[9px] font-mono uppercase tracking-[0.1em] ml-0.5 rounded shadow-sm">
                                        <Plus size={12} className="mr-1" /> Novo Painel
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Control Bar */}
                        {showFilters && (
                            <div className="light-toolbar flex flex-col gap-2 px-2 py-1.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="scrollbar-none flex flex-1 items-center gap-2 overflow-x-auto py-0.5">
                                <Input
                                    placeholder="Buscar tarefas..."
                                    prefix={<Search size={14} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />}
                                    className="h-8 w-[min(16rem,70vw)] rounded-none border-cyan-900/40 bg-[var(--input-bg)] text-sm text-[var(--foreground)] hover:border-cyan-500 focus:border-cyan-500 font-bold sm:w-64"
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Prioridade"
                                    maxTagCount="responsive"
                                    className="min-w-[132px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-pink-900/40 [&_.ant-select-selector]:!min-h-[32px] [&_.ant-select-selection-placeholder]:!text-pink-400 [&_.ant-select-selection-placeholder]:!font-bold font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-pink-500 sm:min-w-[140px]"
                                    value={filters.priority}
                                    onChange={v => setFilters(f => ({ ...f, priority: v }))}
                                    options={[
                                        { label: 'Alta', value: 'high' },
                                        { label: 'Média', value: 'medium' },
                                        { label: 'Baixa', value: 'low' },
                                    ]}
                                    classNames={{ popup: { root: '!rounded-none border border-[var(--input-border)] !bg-[var(--sidebar)] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-[var(--foreground)] [&_.ant-select-item]:!text-xs' } }}
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Responsável"
                                    maxTagCount="responsive"
                                    className="min-w-[146px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-emerald-900/40 [&_.ant-select-selector]:!min-h-[32px] [&_.ant-select-selection-placeholder]:!text-emerald-400 [&_.ant-select-selection-placeholder]:!font-bold font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-emerald-500 sm:min-w-[160px]"
                                    value={filters.assignees}
                                    onChange={v => setFilters(f => ({ ...f, assignees: v }))}
                                    options={uniqueAssignees.map(a => ({ label: a, value: a }))}
                                    classNames={{ popup: { root: '!rounded-none border border-[var(--input-border)] !bg-[var(--sidebar)] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-[var(--foreground)] [&_.ant-select-item]:!text-xs' } }}
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Tags"
                                    maxTagCount="responsive"
                                    className="min-w-[146px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-purple-900/40 [&_.ant-select-selector]:!min-h-[32px] [&_.ant-select-selection-placeholder]:!text-purple-400 [&_.ant-select-selection-placeholder]:!font-bold font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-purple-500 sm:min-w-[160px]"
                                    value={filters.tags}
                                    onChange={v => setFilters(f => ({ ...f, tags: v }))}
                                    options={uniqueTags.map(t => ({ label: t.name, value: t.name }))}
                                    classNames={{ popup: { root: '!rounded-none border border-[var(--input-border)] !bg-[var(--sidebar)] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-[var(--foreground)] [&_.ant-select-item]:!text-xs' } }}
                                />

                                <div className="flex shrink-0 items-center gap-1.5 ml-2">
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, onlyOverdue: !f.onlyOverdue }))}
                                        className={cn(
                                            "flex h-8 items-center gap-1.5 border px-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
                                            filters.onlyOverdue 
                                                ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]" 
                                                : "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--muted-foreground)] hover:border-red-500/40 hover:text-red-400"
                                        )}
                                        title="Filtrar penas tarefas atrasadas"
                                    >
                                        <AlertCircle size={12} className={filters.onlyOverdue ? "animate-pulse" : ""} />
                                        Vencidas
                                    </button>
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-red-500 transition-colors flex items-center gap-1 shrink-0 ml-2 border border-transparent hover:border-red-900/50 bg-transparent hover:bg-red-500/10 px-2 py-1"
                                    >
                                        <Filter size={12} /> Limpar
                                    </button>
                                )}
                            </div>
                            
                            {/* Tags Quick Filters inside collapsible area */}
                            {projectTags[projectId] && projectTags[projectId].length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1 mt-1 border-t border-[var(--input-border)]/20">
                                    <span className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider font-mono mr-1">Tags Rápidas:</span>
                                    {projectTags[projectId].map(tag => {
                                        const isSelected = filters.tags.includes(tag.name);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    setFilters(f => ({
                                                        ...f,
                                                        tags: isSelected 
                                                            ? f.tags.filter(t => t !== tag.name)
                                                            : [...f.tags, tag.name]
                                                    }))
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1 border border-black/10 px-2 py-0.5 z-10 text-[9px] font-mono font-bold uppercase tracking-widest transition-all rounded-sm",
                                                    isSelected ? "ring-1 ring-offset-1 ring-[var(--foreground)] grayscale-0 opacity-100 scale-105" : "opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
                                                )}
                                                style={{ backgroundColor: tag.color, color: getReadableTextColor(tag.color) }}
                                            >
                                                {tag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                </ConfigProvider>

                {isLoadingBoard ? (
                    <LoadingState
                        className="flex-1 min-h-[28rem]"
                        eyebrow="Board Sync"
                        title="Carregando paineis"
                        description="Atualizando colunas, filtros e a leitura operacional deste projeto."
                    />
                ) : filteredColumns.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center mb-6">
                                <LayoutGrid size={28} className="text-[var(--muted-foreground)]" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                                {hasActiveFilters ? "Nenhuma tarefa encontrada" : "Nenhum Painel Criado"}
                            </h2>
                            <p className="text-[var(--muted-foreground)] font-mono text-sm leading-relaxed mb-8">
                                {hasActiveFilters ? "Tente limpar os filtros para ver suas tarefas." : "Este projeto ainda não possui painéis."}
                            </p>
                            {!hasActiveFilters && (
                                <Button variant="primary" onClick={addColumn} className="rounded-none font-mono">
                                    <Plus size={18} className="mr-2" /> Novo Painel
                                </Button>
                            )}
                        </div>
                    </div>
                ) : activeView === 'list' ? (
                    <ProjectListView columns={filteredColumns} onEditTask={openEditModal} />
                ) : activeView === 'calendar' ? (
                    <ProjectCalendarView columns={filteredColumns} onEditTask={openEditModal} />
                ) : activeView === 'timeline' ? (
                    <TimelineView columns={filteredColumns} onEditTask={openEditModal} />
                ) : (
                    <div className="flex-1 overflow-x-auto pb-2 board-scroll-snap md:h-full min-h-0">
                        <div className="flex gap-2 items-start md:items-stretch md:h-full px-1 sm:px-0">
                            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                                {filteredColumns.map((col) => (
                                    <KanbanColumn
                                        key={col.id}
                                        columnId={col.id}
                                        filteredTasks={col.tasks}
                                        onRequestAddTask={handleRequestAddTask}
                                        onEditTask={openEditModal}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </div>
                )}
            </div>

            <TaskModal
                task={editingTask}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={deleteTask}
            />

            <CompletionConfetti burst={celebrationBurst} />

            <ProjectMembersModal
                projectId={projectId}
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
            />

            <ProjectTagsModal
                projectId={projectId}
                isOpen={isTagsModalOpen}
                onClose={() => setIsTagsModalOpen(false)}
            />

            {
                createPortal(
                    <DragOverlay>
                        {activeColumn && <KanbanColumn
                            columnId={activeColumn.id}
                            isOverlay
                            onRequestAddTask={() => { }}
                            onEditTask={() => { }}
                        />}
                        {activeTask && <KanbanCard task={activeTask} isOverlay />}
                    </DragOverlay>,
                    document.body
                )
            }
        </DndContext >
    );
}
