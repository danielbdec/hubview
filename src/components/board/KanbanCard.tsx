'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { GripVertical, Edit2, Clock, Trash2, User } from 'lucide-react';
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
        disabled: isOverlay, // Disable drag logic for overlay
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
                className="opacity-30 h-[120px] bg-[var(--card)] border border-dashed border-[var(--muted-foreground)] rounded-none"
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
                    "p-4 transition-all hover:border-[var(--primary)]/30 bg-[var(--card)] border-[var(--card-border)] flex flex-col gap-3 backdrop-blur-md min-h-[140px] justify-between",
                    task.priority === 'high' ? 'border-l-[3px] border-l-red-500/80' :
                        task.priority === 'medium' ? 'border-l-[3px] border-l-yellow-500/80' :
                            'border-l-[3px] border-l-emerald-500/80',
                    // Sync Status Indicator (Border Right)
                    task.syncStatus === 'syncing' && "border-r-[3px] border-r-amber-400 animate-pulse",
                    task.syncStatus === 'error' && "border-r-[3px] border-r-red-500",

                    isOverlay && "border-[var(--primary)] shadow-[0_0_20px_-5px_var(--primary)] scale-105 rotate-2 z-50",
                    !isOverlay && "hover:-translate-y-1"
                )}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                }}
            >
                {/* Header: Priority & Actions */}
                <div className="flex justify-between items-start">
                    <span className={cn(
                        "text-[10px] font-bold font-mono px-2 py-0.5 border rounded-sm tracking-wider",
                        task.priority === 'high' ? 'border-red-500 text-red-500 bg-red-500/10' :
                            task.priority === 'medium' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                                'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                    )}>
                        {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                    </span>

                    <div className="flex gap-2 items-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                            title="Editar"
                        >
                            <Edit2 size={12} />
                        </button>
                        {onDelete && (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors p-1"
                                title="Excluir"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-[var(--card-hover)] rounded">
                            <GripVertical size={14} className={cn("text-[var(--muted-foreground)] transition-opacity", isOverlay && "text-[var(--primary)]")} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <p className={cn("text-sm font-bold leading-tight transition-colors cursor-pointer",
                    isOverlay ? "text-[var(--foreground)]" : "text-[var(--foreground)] group-hover/card:text-[var(--primary)]"
                )}>
                    {task.content}
                </p>

                {/* Footer: Tags & Dates */}
                <div className="flex flex-col gap-2 mt-auto">
                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {task.tags.map((tag, idx) => (
                                <span
                                    key={`${tag.id}-${idx}`}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white shadow-sm"
                                    style={{ backgroundColor: tag.color }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta: Dates */}
                    {/* Meta: Dates & Assignee */}
                    <div className="mt-2 flex items-center justify-between">
                        {(task.startDate || task.endDate) ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--foreground)] opacity-80">
                                <Clock size={12} className="text-[var(--primary)]" />
                                <span>
                                    {task.startDate ? new Date(task.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'}
                                    {task.endDate && ` - ${new Date(task.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
                                </span>
                            </div>
                        ) : <div />}

                        {task.assignee && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--foreground)] opacity-90 bg-[var(--card-hover)] px-2 py-0.5 rounded-full border border-[var(--card-border)]" title={`Responsável: ${task.assignee}`}>
                                <User size={10} className="text-[var(--primary)]" />
                                <span className="max-w-[70px] truncate">{task.assignee}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
