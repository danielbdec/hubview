'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { TaskModal } from '@/components/board/TaskModal';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

type Task = {
    id: string;
    content: string;
    description?: string;
    tag: string;
    priority: 'low' | 'medium' | 'high';
    checklist?: { id: string; text: string; completed: boolean; }[];
};
type Column = { id: string; title: string; tasks: Task[] };

// Initial Data with Portuguese
const initialColumns: Column[] = [
    {
        id: 'backlog',
        title: 'BACKLOG',
        tasks: [
            { id: '1', content: 'Implementar Autenticação', description: 'Usar NextAuth com Google Provider', tag: 'Backend', priority: 'high' },
            { id: '2', content: 'Auditoria de Design System', tag: 'Design', priority: 'medium' },
            { id: '5', content: 'Schema do Banco de Dados', tag: 'Backend', priority: 'high' },
        ],
    },
    {
        id: 'in-progress',
        title: 'EM PROGRESSO',
        tasks: [
            { id: '3', content: 'Analytics do Dashboard', tag: 'Frontend', priority: 'high' },
        ],
    },
    {
        id: 'review',
        title: 'CODE REVIEW',
        tasks: [
            { id: '6', content: 'Refatorar API', tag: 'Backend', priority: 'medium' },
        ],
    },
    {
        id: 'done',
        title: 'CONCLUÍDO',
        tasks: [
            { id: '4', content: 'Configuração do Projeto', tag: 'DevOps', priority: 'low' },
        ],
    },
];

export default function Kanban() {
    const [columns, setColumns] = useState<Column[]>(initialColumns);
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedColumns = localStorage.getItem('kanban-columns');
        if (savedColumns) {
            try {
                setColumns(JSON.parse(savedColumns));
            } catch (e) {
                console.error('Failed to parse columns', e);
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('kanban-columns', JSON.stringify(columns));
        }
    }, [columns, mounted]);

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { // Use PointerSensor instead of MouseSensor
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

    const addColumn = () => {
        const newColumn: Column = {
            id: uuidv4(),
            title: 'NOVA ETAPA',
            tasks: [],
        };
        setColumns([...columns, newColumn]);
    };

    const deleteColumn = (id: string) => {
        setColumns(columns.filter(col => col.id !== id));
    };

    const updateColumnTitle = (id: string, title: string) => {
        setColumns(columns.map(col => col.id === id ? { ...col, title } : col));
    };

    const handleRequestAddTask = (columnId: string) => {
        const newTask: Task = {
            id: uuidv4(),
            content: '',
            description: '',
            tag: 'Geral',
            priority: 'medium',
        };
        // We'll use a hack or a separate state to track which column this new task belongs to
        // For simplicity, let's just use editingTask but add a meta property or just handle the save differently
        // Actually, let's keep it simple: We'll put the columnId in the task logic or state.
        // A better way: 
        setEditingTask({ ...newTask, _columnId: columnId } as any);
        setIsModalOpen(true);
    };

    const deleteTask = (taskId: string) => {
        setColumns(columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(t => t.id !== taskId)
        })));
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const saveTask = (taskId: string, updates: Partial<Task>) => {
        const isNew = !columns.some(col => col.tasks.some(t => t.id === taskId));

        if (isNew) {
            // It's a new task
            // We need the column ID. We stored it in the editingTask state (as a hack) or we need a cleaner way.
            // Let's rely on the fact that if it's new, the user *must* have clicked "Add Item".
            // The task object passed to saveTask will contain the new data.
            // But wait, TaskModal onSave passes (taskId, updates). 

            const columnId = (editingTask as any)?._columnId;
            if (!columnId) return; // Should not happen if flow is correct

            const newTask = { ...editingTask, ...updates } as Task;
            // Remove the temporary _columnId
            delete (newTask as any)._columnId;
            // Ensure content defaults if empty
            if (!newTask.content) newTask.content = 'Nova Tarefa';

            setColumns(columns.map(col => {
                if (col.id === columnId) {
                    return { ...col, tasks: [...col.tasks, newTask] };
                }
                return col;
            }));

        } else {
            // Update existing
            setColumns(columns.map(col => ({
                ...col,
                tasks: col.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
            })));
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
        // If we're dragging a column, we don't do anything in dragOver
        if (!isActiveTask) return;

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        if (!activeColumn || !overColumn) return;

        if (activeColumn !== overColumn) {
            setColumns((prevColumns) => {
                const activeColIndex = prevColumns.findIndex((col) => col.id === activeColumn.id);
                const overColIndex = prevColumns.findIndex((col) => col.id === overColumn.id);

                // Careful with state updates in React DragOver
                return prevColumns.map((col, index) => {
                    if (index === activeColIndex) {
                        return {
                            ...col,
                            tasks: col.tasks.filter((task) => task.id !== activeId),
                        };
                    } else if (index === overColIndex) {
                        const taskToMove = activeTask ? activeTask : activeColumn.tasks.find((t) => t.id === activeId)!;
                        if (col.tasks.find((t) => t.id === activeId)) return col;

                        return {
                            ...col,
                            tasks: [...col.tasks, taskToMove],
                        };
                    }
                    return col;
                });
            });
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        // Reset active states
        setActiveColumn(null);
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === 'Column';

        if (isActiveColumn) {
            setColumns((columns) => {
                const activeIndex = columns.findIndex((col) => col.id === activeId);
                const overIndex = columns.findIndex((col) => col.id === overId);
                return arrayMove(columns, activeIndex, overIndex);
            });
        } else {
            // Task Drag End
            const activeColumn = findColumn(activeId);
            const overColumn = findColumn(overId);

            if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
                const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
                const overIndex = overColumn.tasks.findIndex((t) => t.id === overId);

                if (activeIndex !== overIndex) {
                    setColumns((columns) => {
                        return columns.map((col) => {
                            if (col.id === activeColumn.id) {
                                return {
                                    ...col,
                                    tasks: arrayMove(col.tasks, activeIndex, overIndex),
                                };
                            }
                            return col;
                        });
                    });
                }
            }
        }
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
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-tight text-white mb-1">
                            OPERAÇÕES KANBAN
                        </h1>
                        <p className="text-gray-400 font-mono text-xs">
                            STATUS_FLUXO: <span className="text-tech-yellow">ATIVO</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Filtrar</Button>
                        <Button variant="primary" size="sm" onClick={addColumn}>
                            <Plus size={16} className="mr-2" /> Nova Etapa
                        </Button>
                    </div>
                </div>

                {/* Columns Container */}
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-6 h-full min-w-[1000px]">
                        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    onDeleteColumn={deleteColumn}
                                    onUpdateTitle={updateColumnTitle}
                                    onRequestAddTask={handleRequestAddTask}
                                    onDeleteTask={(colId, taskId) => deleteTask(taskId)}
                                    onEditTask={openEditModal}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
            </div>

            <TaskModal
                task={editingTask}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={saveTask}
                onDelete={deleteTask}
            />

            {mounted && createPortal(
                <DragOverlay>
                    {activeColumn && <KanbanColumn
                        column={activeColumn}
                        onDeleteColumn={() => { }}
                        onUpdateTitle={() => { }}
                        onRequestAddTask={() => { }}
                        onDeleteTask={() => { }}
                        onEditTask={() => { }}
                    />}
                    {activeTask && <KanbanCard task={activeTask} isOverlay />}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
