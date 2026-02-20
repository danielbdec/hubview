'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Plus, RefreshCw, ArrowLeft, LayoutGrid, Loader2, Search, Filter, Kanban as KanbanIcon, List as ListIcon, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { TaskModal } from '@/components/board/TaskModal';
import { createPortal } from 'react-dom';
import { useProjectStore, Task, Column } from '@/store/kanbanStore';
import { Segmented, Input, Select, ConfigProvider, theme } from 'antd';
import ProjectListView from './ProjectListView';
import ProjectCalendarView from './ProjectCalendarView';

type ViewMode = 'kanban' | 'list' | 'calendar';

export default function KanbanBoardPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const {
        projects,
        setActiveProject,
        activeProjectId,
        addColumn,
        deleteColumn,
        updateColumnTitle,
        updateColumnColor,
        addTask,
        updateTask,
        deleteTask,
        moveColumn,
        moveTask,
        toggleColumnDone,
        setColumns,
        fetchProjects,
        fetchBoardData,
        isLoadingProjects,
        isLoadingBoard
    } = useProjectStore();

    const hasFetchedRef = useRef(false);

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
    }, [projectId]);

    const activeProject = projects.find(p => p.id === projectId);

    // Redirect if invalid
    useEffect(() => {
        // Wait for hydration/store load. Persist usually loads fast but...
        // If projects is empty but loaded, we might redirect.
        // For simplicity, let's just assume if it's not found after a tick, redirect.
        // Actually, just showing "Not Found" is safer than redirect loop.
    }, [activeProject]);

    // Derived state from active project
    const columns = activeProject?.columns || [];

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [activeView, setActiveView] = useState<ViewMode>('kanban');
    const [filters, setFilters] = useState({
        search: '',
        priority: [] as string[],
        assignees: [] as string[],
        tags: [] as string[]
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Extract unique assignees and tags
    const { uniqueAssignees, uniqueTags } = useMemo(() => {
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
    }, [columns]);

    // Filter logic
    const filteredColumns = useMemo(() => {
        const hasFilters = filters.search || filters.priority.length > 0 || filters.assignees.length > 0 || filters.tags.length > 0;
        if (!hasFilters) return columns;

        return columns.map(col => ({
            ...col,
            tasks: (col.tasks || []).filter(task => {
                const matchSearch = !filters.search ||
                    task.content.toLowerCase().includes(filters.search.toLowerCase()) ||
                    (task.description?.toLowerCase() || '').includes(filters.search.toLowerCase());

                const matchPriority = filters.priority.length === 0 || filters.priority.includes(task.priority);
                const matchAssignee = filters.assignees.length === 0 || (task.assignee && filters.assignees.includes(task.assignee));
                const matchTags = filters.tags.length === 0 || (task.tags && task.tags.some(tag => filters.tags.includes(tag.name)));

                return matchSearch && matchPriority && matchAssignee && matchTags;
            })
        }));
    }, [columns, filters]);

    const hasActiveFilters = !!(filters.search || filters.priority.length || filters.assignees.length || filters.tags.length);
    const clearFilters = () => setFilters({ search: '', priority: [], assignees: [], tags: [] });

    const columnIds = useMemo(() => filteredColumns.map((col) => col.id), [filteredColumns]);

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
        setEditingTask({ ...newTask, _columnId: columnId } as any);
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
        const isNew = taskId === 'temp';

        if (isNew) {
            const columnId = (editingTask as any)?._columnId;
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

    // --- Drag and Drop Handlers ---

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const update = active.data.current;

        if (update?.type === 'Column') {
            setActiveColumn(update.column);
            return;
        }

        if (update?.type === 'Task') {
            setActiveTask(update.task);
            return;
        }
    }

    function handleDragOver(event: DragOverEvent) {
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
        const { active, over } = event;

        setActiveColumn(null);
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === 'Column';

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

    if (!mounted) return null;

    if (!activeProject) {
        // Still loading — show spinner instead of 'not found'
        if (isLoadingProjects || isLoadingBoard) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                    <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando projeto...</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col pt-2 max-w-full overflow-hidden">
                {/* Header & Control Bar Area */}
                <ConfigProvider
                    theme={{
                        algorithm: theme.darkAlgorithm,
                        token: {
                            colorBgContainer: 'transparent',
                            colorBorder: 'var(--input-border)',
                            colorText: 'var(--foreground)',
                            colorTextPlaceholder: 'var(--muted-foreground)',
                            borderRadius: 0,
                            fontFamily: 'var(--font-geist-sans)',
                            colorPrimary: 'var(--primary)',
                            controlItemBgActive: 'var(--card-hover)',
                            colorBgElevated: '#0a0a0a',
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
                    <div className="flex flex-col gap-4 mb-6">
                        {/* Top Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" onClick={() => router.push('/projects')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] pr-0 pl-1">
                                    <ArrowLeft size={16} />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-1 leading-none shadow-none truncate max-w-[400px]">
                                        {activeProject.title}
                                    </h1>
                                    <p className="text-[var(--muted-foreground)] font-mono text-xs">
                                        STATUS_FLUXO: <span className="text-yellow-500 font-bold">ATIVO</span> | <span className="opacity-50 tracking-widest">ID: {activeProject.id.slice(0, 8)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="border border-[var(--input-border)] bg-[var(--input-bg)] p-0.5 flex">
                                    <Segmented
                                        value={activeView}
                                        onChange={(value) => setActiveView(value as ViewMode)}
                                        className="bg-transparent font-mono text-[10px] tracking-widest uppercase [&_.ant-segmented-item-selected]:bg-[var(--primary)] [&_.ant-segmented-item-selected]:text-black [&_.ant-segmented-item-selected]:font-bold [&_.ant-segmented-item-selected]:!rounded-none [&_.ant-segmented-item]:!rounded-none [&_.ant-segmented-item]:text-[var(--muted-foreground)]"
                                        options={[
                                            { label: <div className="flex items-center gap-1.5 px-3 py-1"><KanbanIcon size={14} /> Kanban</div>, value: 'kanban' },
                                            { label: <div className="flex items-center gap-1.5 px-3 py-1"><ListIcon size={14} /> Lista</div>, value: 'list' },
                                            { label: <div className="flex items-center gap-1.5 px-3 py-1"><CalendarIcon size={14} /> Calendário</div>, value: 'calendar' },
                                        ]}
                                    />
                                </div>

                                <Button variant="ghost" size="sm" onClick={handleRefresh} title="Atualizar Board" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-none border border-transparent hover:border-[var(--card-border)] h-[32px]">
                                    <RefreshCw size={16} className={isLoadingBoard ? 'animate-spin text-[var(--primary)]' : ''} />
                                </Button>

                                <Button variant="primary" size="sm" onClick={addColumn} disabled={isLoadingBoard || activeView !== 'kanban'} className="rounded-none font-mono tracking-widest uppercase text-[10px] min-w-[140px] h-[32px]">
                                    <Plus size={16} className="mr-2" /> Novo Painel
                                </Button>
                            </div>
                        </div>

                        {/* Control Bar */}
                        <div className="flex items-center justify-between bg-[var(--sidebar)]/80 p-2 border-y border-[var(--sidebar-border)] backdrop-blur-sm -mx-6 px-6">
                            <div className="flex items-center gap-3 flex-1 overflow-x-auto scrollbar-none py-1">
                                <Input
                                    placeholder="Buscar tarefas..."
                                    prefix={<Search size={14} className="text-[var(--muted-foreground)]" />}
                                    className="w-64 rounded-none bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] hover:border-[var(--primary)] focus:border-[var(--primary)] h-8 text-sm"
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Prioridade"
                                    maxTagCount="responsive"
                                    className="min-w-[140px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-[var(--input-border)] [&_.ant-select-selector]:!min-h-[32px] font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-[var(--primary)]"
                                    value={filters.priority}
                                    onChange={v => setFilters(f => ({ ...f, priority: v }))}
                                    options={[
                                        { label: 'Alta', value: 'high' },
                                        { label: 'Média', value: 'medium' },
                                        { label: 'Baixa', value: 'low' },
                                    ]}
                                    popupClassName="!rounded-none border border-[var(--input-border)] !bg-[#0a0a0a] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-xs"
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Responsável"
                                    maxTagCount="responsive"
                                    className="min-w-[160px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-[var(--input-border)] [&_.ant-select-selector]:!min-h-[32px] font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-[var(--primary)]"
                                    value={filters.assignees}
                                    onChange={v => setFilters(f => ({ ...f, assignees: v }))}
                                    options={uniqueAssignees.map(a => ({ label: a, value: a }))}
                                    popupClassName="!rounded-none border border-[var(--input-border)] !bg-[#0a0a0a] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-xs"
                                />

                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Tags"
                                    maxTagCount="responsive"
                                    className="min-w-[160px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!bg-[var(--input-bg)] [&_.ant-select-selector]:!border-[var(--input-border)] [&_.ant-select-selector]:!min-h-[32px] font-mono text-xs shadow-none hover:[&_.ant-select-selector]:!border-[var(--primary)]"
                                    value={filters.tags}
                                    onChange={v => setFilters(f => ({ ...f, tags: v }))}
                                    options={uniqueTags.map(t => ({ label: t.name, value: t.name }))}
                                    popupClassName="!rounded-none border border-[var(--input-border)] !bg-[#0a0a0a] [&_.ant-select-item]:!rounded-none [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!font-mono [&_.ant-select-item]:!text-xs"
                                />

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-red-500 transition-colors flex items-center gap-1 shrink-0 ml-2 border border-transparent hover:border-red-900/50 bg-transparent hover:bg-red-500/10 px-2 py-1"
                                    >
                                        <Filter size={12} /> Limpar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </ConfigProvider>


                {isLoadingBoard ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                        <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando painéis...</p>
                    </div>
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
                ) : (
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-6 h-full items-stretch min-w-[1000px]">
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
