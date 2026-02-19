'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { GripVertical, Edit2, Clock, Trash2, User, AlertCircle, AlertTriangle, ArrowDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { Task } from '@/store/kanbanStore';

interface KanbanCardProps {
    task: Task;
    isOverlay?: boolean;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

const PriorityIcon = ({ priority }: { priority: string }) => {
    switch (priority) {
        case 'high': return <AlertCircle size={10} className="text-red-500" />;
        case 'medium': return <AlertTriangle size={10} className="text-amber-500" />;
        case 'low': return <ArrowDown size={10} className="text-emerald-500" />;
        default: return null;
    }
};

export function KanbanCard({ task, isOverlay, onEdit, onDelete }: KanbanCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
        disabled: isOverlay,
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 h-[100px] bg-[var(--card)] border-2 border-dashed border-[var(--muted-foreground)] rounded-md"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("touch-none relative group/card")}
        >
            <Card
                variant={isOverlay ? "glass" : "default"}
                {...attributes}
                {...listeners}
                className={cn(
                    "p-3 transition-all hover:bg-[var(--card-hover)]/80 bg-[var(--card)] border-[var(--card-border)] flex flex-col gap-2.5 backdrop-blur-md relative overflow-hidden group/inner",
                    // Reverted to Left Border Style (User Preference)
                    task.priority === 'high' ? 'border-l-[3px] border-l-red-500' :
                        task.priority === 'medium' ? 'border-l-[3px] border-l-amber-500' :
                            'border-l-[3px] border-l-emerald-500',

                    isOverlay && "border-2 border-[var(--primary)] shadow-[0_0_20px_-5px_var(--primary)] scale-105 rotate-1 z-50 cursor-grabbing",
                    !isOverlay && "hover:-translate-y-0.5 hover:shadow-md cursor-grab active:cursor-grabbing",
                    task.syncStatus === 'syncing' && "after:absolute after:top-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-amber-400 after:rounded-bl-full after:animate-pulse"
                )}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                }}
            >
                {/* Hover Actions (Absolute Top Right) */}
                <div className={cn(
                    "absolute top-2 right-2 flex gap-1 transform translate-x-2 opacity-0 group-hover/inner:translate-x-0 group-hover/inner:opacity-100 transition-all duration-200 z-10 bg-[var(--card)]/90 rounded-bl-md pl-2 pb-1"
                )}>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 hover:bg-[var(--background)] rounded"
                        title="Editar"
                    >
                        <Edit2 size={12} />
                    </button>
                    {onDelete && (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                            className="text-[var(--muted-foreground)] hover:text-red-500 p-1 hover:bg-red-500/10 rounded"
                            title="Excluir"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>

                {/* Tags (Top Row) */}
                {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pr-8">
                        {task.tags.map((tag, idx) => (
                            <span
                                key={`${tag.id}-${idx}`}
                                className="text-[9px] font-bold px-1.5 py-[2px] rounded-[3px] text-white shadow-sm flex items-center tracking-wide uppercase"
                                style={{ backgroundColor: tag.color }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content - Main Visual Weight */}
                <p className="text-[13px] font-medium leading-snug text-[var(--foreground)] break-words pr-2 line-clamp-3">
                    {task.content}
                </p>

                {/* Footer - Metadata */}
                <div className="flex items-center justify-between mt-0.5 pt-2 border-t border-[var(--border)]/30 text-[10px] text-[var(--muted-foreground)]">

                    {/* Left: Priority & Date */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5" title={`Prioridade: ${task.priority}`}>
                            <PriorityIcon priority={task.priority} />
                            <span className={cn(
                                "font-mono uppercase tracking-wider font-bold",
                                task.priority === 'high' ? 'text-red-500' :
                                    task.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                            )}>
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Med' : 'Baixa'}
                            </span>
                        </div>

                        {(task.startDate || task.endDate) && (
                            <div className="flex items-center gap-1 opacity-80 group-hover/inner:opacity-100 transition-opacity" title="Data Prevista (Início - Fim)">
                                <Clock size={10} />
                                <span className="font-mono text-[9px]">
                                    {task.startDate ? (() => {
                                        // Split and create date to avoid UTC/timezone issues
                                        const parts = task.startDate.split(/[-T]/);
                                        if (parts.length >= 3) {
                                            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        }
                                        return new Date(task.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                    })() : '...'}
                                    {' - '}
                                    {task.endDate ? (() => {
                                        const parts = task.endDate.split(/[-T]/);
                                        if (parts.length >= 3) {
                                            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        }
                                        return new Date(task.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                    })() : '...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Assignee */}
                    {task.assignee && task.assignee !== 'Unassigned' && (
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] group-hover/inner:border-[var(--primary)]/30 transition-colors" title={task.assignee}>
                            <User size={10} className="text-[var(--primary)]" />
                            <span className="max-w-[80px] truncate font-medium">{task.assignee.split(' ')[0]}</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
