'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Plus, Download, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { TaskModal } from '@/components/board/TaskModal';
import { createPortal } from 'react-dom';
import { useKanbanStore, Task, Column } from '@/store/kanbanStore';

export default function Kanban() {
    const {
        columns,
        addColumn,
        deleteColumn,
        updateColumnTitle,
        addTask,
        updateTask,
        deleteTask,
        moveColumn,
        moveTask,
        setColumns
    } = useKanbanStore();

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            id: 'temp', // provisional
            content: '',
            description: '',
            tag: 'Geral',
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

            // Ensure content defaults if empty
            const content = updates.content || 'Nova Tarefa';

            addTask(columnId, {
                content,
                description: updates.description,
                tag: updates.tag || 'Geral',
                priority: updates.priority || 'medium',
                checklist: updates.checklist
            });

        } else {
            updateTask(taskId, updates);
        }
    };

    // --- Utilities ---

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(columns, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "kanban_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedColumns = JSON.parse(e.target?.result as string);
                if (Array.isArray(importedColumns)) {
                    if (confirm('Isso substituirá o quadro atual. Deseja continuar?')) {
                        setColumns(importedColumns);
                    }
                } else {
                    alert('Arquivo inválido. O formato deve ser um array de colunas.');
                }
            } catch (error) {
                console.error('Erro ao importar:', error);
                alert('Erro ao ler o arquivo JSON.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('Tem certeza? Isso apagará todas as tarefas e restaurará o layout padrão.')) {
            localStorage.removeItem('hubview-storage-v1'); // Clear storage
            window.location.reload(); // Reload to re-init store with defaults
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
            // We don't update state in DragOver with Zustand to avoid dispatch spam, 
            // relying on DragEnd is safer and sufficient for simple lists, 
            // BUT for visual feedback dnd-kit recommends doing it.
            // Given Zustand is fast, let's try to just let dnd-kit handle the visual overlay 
            // or implement a temporary local state if needed. 
            // Actually, for dnd-kit to show the gap properly, the items need to move.
            // We can call a specialized moveTask action that updates without saving? 
            // Or just ignore for now and execute on DragEnd. 
            // *Correction*: dnd-kit *needs* the items to move in the sortable context for the hole to appear.
            // So we should call a state update.

            // However, calling the persistent store on every hover is bad performance-wise (localStorage writes).
            // Let's rely on standard dnd-kit behavior: implementing `moveTask` on dragOver.

            // Wait, `moveTask` in store writes to state. Zustand persist uses localStorage (sync usually).
            // Writing to LS on every frame/dragOver is heavy.
            // Ideally we should use transient updates or debounced save.
            // For this step, I will implement it in DragOver as commonly done, but be aware of perf.

            // Let's invoke the store action
            moveTask(activeId, overId, activeColumn.id, overColumn.id);
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
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportFile}
                            className="hidden"
                            accept=".json"
                        />
                        <Button variant="ghost" size="sm" onClick={handleReset} title="Resetar Board">
                            <RotateCcw size={16} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExport} title="Exportar JSON">
                            <Download size={16} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleImportClick} title="Importar JSON">
                            <Upload size={16} />
                        </Button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
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
                onSave={handleSaveTask}
                onDelete={deleteTask}
            />

            {createPortal(
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
