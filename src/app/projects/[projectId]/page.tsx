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
import { Plus, Download, Upload, RotateCcw, ArrowLeft, LayoutGrid } from 'lucide-react';
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
        setColumns
    } = useProjectStore();

    // Effect to synchronization
    useEffect(() => {
        if (projectId) {
            setActiveProject(projectId);
        }
    }, [projectId, setActiveProject]);

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
                checklist: updates.checklist
            });

        } else {
            updateTask(taskId, updates);
        }
    };

    // --- Utilities ---

    const handleExport = () => {
        if (!activeProject) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(columns, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${activeProject.title}_backup.json`);
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
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('Tem certeza? Isso apagará todas as tarefas deste projeto.')) {
            // We can manually reset columns to default template or empty
            // But the store doesn't have a "resetProject" action exposed yet.
            // Let's just create a new project behavior or empty the columns.
            setColumns([]);
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
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Projeto não encontrado ou carregando...</p>
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
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportFile}
                            className="hidden"
                            accept=".json"
                        />
                        <Button variant="ghost" size="sm" onClick={handleReset} title="Resetar Board" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]">
                            <RotateCcw size={16} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExport} title="Exportar JSON" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]">
                            <Download size={16} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleImportClick} title="Importar JSON" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]">
                            <Upload size={16} />
                        </Button>
                        <div className="w-px h-6 bg-[var(--card-border)] mx-2" />
                        <Button variant="primary" size="sm" onClick={addColumn}>
                            <Plus size={16} className="mr-2" /> Novo Painel
                        </Button>
                    </div>
                </div>

                {columns.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center mb-6">
                                <LayoutGrid size={28} className="text-[var(--muted-foreground)]" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                                Nenhum Painel Criado
                            </h2>
                            <p className="text-[var(--muted-foreground)] font-mono text-sm leading-relaxed mb-8">
                                Este projeto ainda não possui painéis. Clique em{' '}
                                <span className="text-[var(--primary)] font-bold">+ Novo Painel</span>{' '}
                                para começar a organizar suas tarefas.
                            </p>
                            <Button variant="primary" onClick={addColumn}>
                                <Plus size={18} className="mr-2" /> Novo Painel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-6 h-full min-w-[1000px]">
                            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                                {columns.map((col) => (
                                    <KanbanColumn
                                        key={col.id}
                                        column={col}
                                        onDeleteColumn={deleteColumn}
                                        onUpdateTitle={updateColumnTitle}
                                        onUpdateColor={updateColumnColor}
                                        onRequestAddTask={handleRequestAddTask}
                                        onDeleteTask={(colId, taskId) => deleteTask(taskId)}
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
