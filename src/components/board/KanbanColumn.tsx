'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, MoreHorizontal, Check, Palette, CheckCircle2 } from 'lucide-react';
import { KanbanCard } from '@/components/board/KanbanCard';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Task, Column } from '@/store/kanbanStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface KanbanColumnProps {
    column: Column;
    onDeleteColumn: (id: string) => void;
    onUpdateTitle: (id: string, title: string) => void;
    onUpdateColor?: (id: string, color: string) => void;
    onRequestAddTask: (columnId: string) => void;
    onDeleteTask: (columnId: string, taskId: string) => void;
    onEditTask: (task: any) => void;
    onToggleDone: (id: string) => void;
}

const COLORS = [
    '#ef4444', // Red
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
];

export function KanbanColumn({
    column,
    onDeleteColumn,
    onUpdateTitle,
    onUpdateColor,
    onRequestAddTask,
    onDeleteTask,
    onEditTask,
    onToggleDone
}: KanbanColumnProps) {
    const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(column.title);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteColumnConfirm, setShowDeleteColumnConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const columnColor = column.color || 'var(--primary)';

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

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
        setShowDeleteColumnConfirm(true);
    };

    const confirmDeleteColumn = () => {
        onDeleteColumn(column.id);
        setShowDeleteColumnConfirm(false);
    };

    const confirmDeleteTask = () => {
        if (taskToDelete) {
            onDeleteTask(column.id, taskToDelete);
            setTaskToDelete(null);
        }
    };

    const handleColorSelect = (color: string) => {
        if (onUpdateColor) {
            onUpdateColor(column.id, color);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "w-80 flex-shrink-0 flex flex-col rounded-md border transition-all relative h-full max-h-full shadow-sm",
                "bg-[var(--column-bg)] border-[var(--card-border)]",
                column.isDone && "bg-emerald-500/5 border-emerald-500/20",
                isDragging && "opacity-50 border-[var(--col-color)] border-dashed ring-2 ring-[var(--col-color)] ring-opacity-50"
            )}
        >
            {/* Color Line Indicator */}
            <div className="h-1 w-full rounded-t-md" style={{ backgroundColor: columnColor }} />

            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "p-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-[var(--card-border)] bg-[var(--card-hover)] group/header relative",
                    column.isDone && "bg-emerald-500/10"
                )}
            >
                <div className="flex items-center gap-2 flex-1 relative min-w-0">
                    {column.isDone && (
                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    )}

                    {isEditingTitle ? (
                        <input
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="bg-[var(--background)] text-sm font-bold font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--col-color)] w-full uppercase tracking-wider px-2 py-1 rounded"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                    ) : (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h3
                                onClick={() => setIsEditingTitle(true)}
                                className={cn(
                                    "text-sm font-bold font-mono text-[var(--foreground)] uppercase tracking-wider truncate cursor-text hover:text-[var(--col-color)] transition-colors",
                                    column.isDone && "text-emerald-600 dark:text-emerald-400"
                                )}
                                title={column.title}
                            >
                                {column.title}
                            </h3>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono bg-[var(--background)] px-1.5 py-0.5 rounded-full border border-[var(--card-border)]">
                                {column.tasks.length}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 pl-2">
                    {column.syncStatus === 'syncing' && (
                        <span className="animate-spin h-3 w-3 border-2 border-[var(--primary)] border-t-transparent rounded-full mr-1" title="Sincronizando..." />
                    )}

                    {/* Settings Menu Button */}
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSettings(!showSettings);
                            }}
                            className={cn(
                                "p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors",
                                showSettings && "bg-[var(--background)] text-[var(--foreground)] ring-1 ring-[var(--card-border)]"
                            )}
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {/* Settings Popover */}
                        {showSettings && (
                            <div
                                className="absolute right-0 top-full mt-1 w-56 z-[70] p-3 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-4">
                                    {/* Colors */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-[var(--muted-foreground)]">
                                            <Palette size={12} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Cor da Coluna</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorSelect(color)}
                                                    className={cn(
                                                        "w-full aspect-square rounded-md border transition-all hover:scale-110",
                                                        columnColor === color ? "border-[var(--foreground)] ring-2 ring-[var(--foreground)] ring-opacity-20" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-[var(--card-border)]" />

                                    {/* Is Done Toggle - Redesigned */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border group active:scale-95 select-none",
                                            column.isDone
                                                ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                                                : "bg-[var(--background)] border-[var(--card-border)] hover:border-[var(--foreground)]/30 hover:shadow-sm"
                                        )}
                                        onClick={() => {
                                            if (column.syncStatus !== 'syncing') {
                                                onToggleDone(column.id);
                                            }
                                        }}
                                    >
                                        <div className={cn(
                                            "w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out flex-shrink-0",
                                            column.isDone ? "bg-emerald-500" : "bg-[var(--muted-foreground)]/30 group-hover:bg-[var(--muted-foreground)]/50"
                                        )}>
                                            <div className={cn(
                                                "bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out",
                                                column.isDone ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "text-sm font-bold transition-colors",
                                                column.isDone ? "text-emerald-500" : "text-[var(--foreground)]"
                                            )}>
                                                Concluir Tarefas
                                            </p>
                                            <p className="text-[10px] text-[var(--muted-foreground)] leading-tight mt-0.5 font-medium opacity-80">
                                                Marca tarefas como 100%
                                            </p>
                                        </div>
                                        {column.isDone && <CheckCircle2 size={14} className="text-emerald-500 animate-in zoom-in spin-in-90 duration-300" />}
                                    </div>

                                    <div className="h-px bg-[var(--card-border)]" />

                                    {/* Delete */}
                                    <button
                                        onClick={() => {
                                            setShowSettings(false);
                                            handleDelete();
                                        }}
                                        className="w-full flex items-center gap-2 p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        <Trash2 size={14} />
                                        <span>Excluir Coluna</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tasks Container */}
            <div className={cn(
                "flex-1 p-2 overflow-y-auto min-h-0 space-y-2 scrollbar-thin scrollbar-thumb-[var(--muted-foreground)]/20 scrollbar-track-transparent",
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
                            onDelete={(taskId) => setTaskToDelete(taskId)}
                            onEdit={onEditTask}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-[var(--card-border)] bg-[var(--card)]">
                <button
                    onClick={() => onRequestAddTask(column.id)}
                    className="w-full py-2 border-[1px] border-[var(--col-color)] text-[var(--col-color)] font-bold bg-[var(--col-color)]/5 hover:bg-[var(--col-color)] hover:text-white transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 rounded shadow-sm"
                >
                    <Plus size={14} strokeWidth={3} /> Nova Tarefa
                </button>
            </div>
            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteColumnConfirm}
                title="Excluir Coluna"
                message="Tem certeza que deseja excluir esta coluna e todas as suas tarefas? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={confirmDeleteColumn}
                onCancel={() => setShowDeleteColumnConfirm(false)}
            />

            <ConfirmModal
                isOpen={!!taskToDelete}
                title="Excluir Tarefa"
                message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={confirmDeleteTask}
                onCancel={() => setTaskToDelete(null)}
            />
        </div>
    );
}
