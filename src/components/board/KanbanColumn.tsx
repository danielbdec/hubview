'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { KanbanCard } from '@/components/board/KanbanCard';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';

type Task = { id: string; content: string; tag: string; priority: 'low' | 'medium' | 'high' };
type Column = { id: string; title: string; tasks: Task[] };

interface KanbanColumnProps {
    column: Column;
    onDeleteColumn: (id: string) => void;
    onUpdateTitle: (id: string, title: string) => void;
    onRequestAddTask: (columnId: string) => void;
    onDeleteTask: (columnId: string, taskId: string) => void;
    onEditTask: (task: any) => void;
}

export function KanbanColumn({ column, onDeleteColumn, onUpdateTitle, onRequestAddTask, onDeleteTask, onEditTask }: KanbanColumnProps) {
    const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [columnTitle, setColumnTitle] = useState(column.title);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
        disabled: true,
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const handleTitleSubmit = () => {
        if (columnTitle.trim()) {
            onUpdateTitle(column.id, columnTitle);
        } else {
            setColumnTitle(column.title); // Revert if empty
        }
        setIsEditingTitle(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-[320px] flex flex-col h-full bg-white/5 border border-white/5 rounded-none p-2 group/column"
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-2 pb-2 mt-2 border-b border-white/10 min-h-[40px]">
                <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${column.id === 'todo' ? 'bg-gray-500' :
                        column.id === 'in-progress' ? 'bg-tech-yellow' :
                            column.id === 'review' ? 'bg-purple-500' : 'bg-tech-green'
                        }`} />

                    {isEditingTitle ? (
                        <div className="flex items-center gap-1 flex-1">
                            <Input
                                value={columnTitle}
                                onChange={(e) => setColumnTitle(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                                className="h-6 text-xs w-full bg-black border-tech-green text-tech-green"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <h3
                            className="text-sm font-bold font-mono tracking-wider text-gray-300 uppercase cursor-pointer hover:text-white truncate max-w-[180px]"
                            onDoubleClick={() => setIsEditingTitle(true)}
                            title="Clique duplo para editar"
                        >
                            {column.title}
                        </h3>
                    )}

                    <span className="text-xs text-gray-600 font-mono">[{column.tasks.length}]</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditingTitle(!isEditingTitle)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded"
                        title="Editar Título"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={() => onDeleteColumn(column.id)}
                        className="p-1 text-gray-500 hover:text-tech-red hover:bg-white/10 rounded"
                        title="Excluir Coluna"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Droppable Area */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-3">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map((task) => (
                        <div key={task.id} className="relative group/card-wrapper">
                            <KanbanCard task={task} onEdit={onEditTask} />
                            <button
                                onClick={() => onDeleteTask(column.id, task.id)}
                                className="absolute top-2 right-2 p-1.5 bg-black/80 text-gray-400 hover:text-tech-red hover:bg-black rounded opacity-0 group-hover/card-wrapper:opacity-100 transition-opacity z-10"
                                title="Excluir Tarefa"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </SortableContext>

                {/* Add Item Area */}
                <button
                    onClick={() => onRequestAddTask(column.id)}
                    className="w-full py-3 border border-dashed border-white/10 text-gray-600 text-xs font-mono hover:text-tech-green hover:border-tech-green/30 transition-colors uppercase tracking-wider flex items-center justify-center gap-2 mt-1 active:bg-white/5"
                >
                    <Plus size={12} /> ADICIONAR ITEM
                </button>
            </div>
        </div>
    );
}
