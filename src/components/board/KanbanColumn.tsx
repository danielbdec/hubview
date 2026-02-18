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
    onUpdateColor?: (id: string, color: string) => void;
    onRequestAddTask: (columnId: string) => void;
    onDeleteTask: (columnId: string, taskId: string) => void;
    onEditTask: (task: any) => void;
}

export function KanbanColumn({ column, onDeleteColumn, onUpdateTitle, onUpdateColor, onRequestAddTask, onDeleteTask, onEditTask }: KanbanColumnProps) {
    const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(column.title);

    const columnColor = column.color || 'var(--primary)';

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
        '--col-color': columnColor,
    } as React.CSSProperties;

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

    const handleColorClick = () => {
        if (!onUpdateColor) return;
        const colors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
        const currentIndex = colors.findIndex(c => c.toLowerCase() === (column.color || '').toLowerCase());
        const nextColor = colors[(currentIndex + 1) % colors.length];
        onUpdateColor(column.id, nextColor);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "w-80 flex-shrink-0 flex flex-col rounded-sm border transition-colors",
                "bg-[var(--column-bg)] border-[var(--card-border)]",
                isDragging && "opacity-50 border-[var(--col-color)] border-dashed"
            )}
        >
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-[var(--card-border)] bg-[var(--card-hover)] group/header"
            >
                <div className="flex items-center gap-2 flex-1">
                    <div
                        className="w-3 h-3 rounded-full shadow-[0_0_8px_-2px_var(--col-color)] cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: 'var(--col-color)' }}
                        onClick={handleColorClick}
                        title="Clique para alterar a cor"
                    />
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
                            className="text-sm font-bold font-mono text-[var(--foreground)] uppercase tracking-wider truncate cursor-text hover:text-[var(--col-color)] transition-colors"
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
            <div className={cn(
                "flex-1 p-2 overflow-y-auto min-h-[150px] space-y-2 scrollbar-thumb-[var(--muted-foreground)] scrollbar-track-[var(--card)]",
                column.tasks.length === 0 && "flex items-center justify-center border-2 border-dashed border-[var(--card-border)]/50 rounded-sm m-2 bg-[var(--card-hover)]/30"
            )}>
                {column.tasks.length === 0 && (
                    <div className="text-center p-4 opacity-50 select-none pointer-events-none">
                        <p className="text-[10px] font-mono uppercase text-[var(--muted-foreground)]">Sem Tarefas</p>
                    </div>
                )}
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
                    className="w-full py-2.5 border-[1px] border-[var(--col-color)] text-[var(--col-color)] font-bold bg-[var(--col-color)]/10 text-xs font-mono transition-all hover:bg-[var(--col-color)] hover:text-[var(--background)] uppercase tracking-wider flex items-center justify-center gap-2 mt-1 rounded-sm shadow-[0_0_10px_-5px_var(--col-color)]"
                >
                    <Plus size={14} strokeWidth={3} /> ADICIONAR ITEM
                </button>
            </div>
        </div>
    );
}
