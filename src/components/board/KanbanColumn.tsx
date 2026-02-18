'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2 } from 'lucide-react';
import { KanbanCard } from '@/components/board/KanbanCard';
import { useMemo, useState } from 'react';
import { Task, Column } from '@/store/kanbanStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    const [titleInput, setTitleInput] = useState(column.title);

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
        disabled: false
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const handleTitleSubmit = () => {
        if (titleInput.trim()) {
            onUpdateTitle(column.id, titleInput);
        } else {
            setTitleInput(column.title);
        }
        setIsEditingTitle(false);
    };

    const handleDelete = () => {
        onDeleteColumn(column.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "w-80 flex-shrink-0 flex flex-col rounded-sm border transition-colors",
                "bg-[var(--column-bg)] border-[var(--card-border)]",
                isDragging && "opacity-50 border-[var(--primary)] border-dashed"
            )}
        >
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-[var(--card-border)] bg-[var(--card-hover)] group/header"
            >
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_8px_-2px_var(--primary)]" />
                    {isEditingTitle ? (
                        <input
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="bg-transparent text-sm font-bold font-mono text-[var(--foreground)] focus:outline-none w-full uppercase tracking-wider"
                            autoFocus
                        />
                    ) : (
                        <h3
                            onClick={() => setIsEditingTitle(true)}
                            className="text-sm font-bold font-mono text-[var(--foreground)] uppercase tracking-wider truncate cursor-text hover:text-[var(--primary)] transition-colors"
                        >
                            {column.title}
                        </h3>
                    )}
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">({column.tasks.length})</span>
                </div>

                <div className="flex items-center opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <button
                        onClick={handleDelete}
                        className="text-[var(--muted-foreground)] hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 p-2 overflow-y-auto min-h-[100px] space-y-2 scrollbar-thumb-[var(--muted-foreground)] scrollbar-track-[var(--card)]">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map((task) => (
                        <KanbanCard
                            key={task.id}
                            task={task}
                            onDelete={(taskId) => onDeleteTask(column.id, taskId)}
                            onEdit={onEditTask}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-[var(--card-border)]">
                <button
                    onClick={() => onRequestAddTask(column.id)}
                    className="w-full py-3 border border-dashed border-[var(--muted-foreground)]/30 hover:border-[var(--primary)] text-[var(--muted-foreground)] hover:text-[var(--primary)] text-xs font-mono transition-colors uppercase tracking-wider flex items-center justify-center gap-2 mt-1 hover:bg-[var(--card-hover)] active:bg-[var(--card-hover)]"
                >
                    <Plus size={12} /> ADICIONAR ITEM
                </button>
            </div>
        </div>
    );
}
