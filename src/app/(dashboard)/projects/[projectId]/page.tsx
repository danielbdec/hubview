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
import { Plus, RefreshCw, ArrowLeft, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { TaskModal } from '@/components/board/TaskModal';
import { createPortal } from 'react-dom';
import { useProjectStore, Task, Column } from '@/store/kanbanStore';

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


    useEffect(() => {
        setMounted(true);
    }, []);

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);

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
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                            <ArrowLeft size={16} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-1">
                                {activeProject.title}
                            </h1>
                            <p className="text-[var(--muted-foreground)] font-mono text-xs">
                                STATUS_FLUXO: <span className="text-yellow-500">ATIVO</span> | ID: {activeProject.id.slice(0, 8)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleRefresh} title="Atualizar Board" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]">
                            <RefreshCw size={16} className={isLoadingBoard ? 'animate-spin' : ''} />
                        </Button>

                        <Button variant="primary" size="sm" onClick={addColumn} disabled={isLoadingBoard}>
                            <Plus size={16} className="mr-2" /> Novo Painel
                        </Button>
                    </div>
                </div>

                {isLoadingBoard ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                        <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando painéis...</p>
                    </div>
                ) : columns.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center mb-6">
                                <LayoutGrid size={28} className="text-[var(--muted-foreground)]" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                                Nenhum Painel Criado
                            </h2>
                            <p className="text-[var(--muted-foreground)] font-mono text-sm leading-relaxed mb-8">
                                Este projeto ainda não possui painéis.
                            </p>
                            <Button variant="primary" onClick={addColumn}>
                                <Plus size={18} className="mr-2" /> Novo Painel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-6 h-full items-stretch min-w-[1000px]">
                            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                                {columns.map((col) => (
                                    <KanbanColumn
                                        key={col.id}
                                        columnId={col.id}
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

            {createPortal(
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
            )}
        </DndContext>
    );
}
