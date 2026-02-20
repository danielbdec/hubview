'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { GripVertical, Edit2, Clock, Trash2, User, AlertCircle, AlertTriangle, ArrowDown, CheckSquare } from 'lucide-react';
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
                className="opacity-30 h-[100px] bg-[var(--card)] border border-dashed border-[var(--primary)] rounded-none"
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
                    "p-0 transition-all bg-[var(--card)] border border-[var(--card-border)] rounded-none flex flex-col gap-0 relative group/inner",
                    // Sharp geometry & active physical tension shadow
                    !isOverlay && "hover:-translate-y-1 hover:translate-x-[-2px] hover:shadow-[4px_4px_0_0_var(--primary)] cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50",
                    isOverlay && "border border-[var(--primary)] shadow-[8px_8px_0_0_var(--primary)] scale-105 z-50 cursor-grabbing bg-[var(--background)]",
                    task.syncStatus === 'syncing' && "after:absolute after:top-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-amber-400 after:animate-pulse"
                )}
                style={{ borderRadius: '0px' }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                }}
            >
                {/* Visual Header / Priority Bar */}
                <div className={cn(
                    "h-1 w-full",
                    task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-amber-500' :
                            'bg-emerald-500'
                )} />

                <div className="p-3 flex flex-col gap-2.5">
                    {/* Hover Actions (Absolute Top Right) */}
                    <div className={cn(
                        "absolute top-2 right-2 flex gap-1 transform translate-x-2 opacity-0 group-hover/inner:translate-x-0 group-hover/inner:opacity-100 transition-all duration-200 z-10 bg-[var(--card)] border border-[var(--border)] rounded-none pl-1 pr-1 py-1"
                    )}>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                            className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-1 hover:bg-[var(--primary)]/10 transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={12} />
                        </button>
                        {onDelete && (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                className="text-[var(--muted-foreground)] hover:text-red-500 p-1 hover:bg-red-500/10 transition-colors"
                                title="Excluir"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>

                    {/* Tags (Top Row) */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pr-8 mt-1">
                            {task.tags.map((tag, idx) => (
                                <span
                                    key={`${tag.id}-${idx}`}
                                    className="text-[9px] font-mono font-bold px-1.5 py-[2px] text-white flex items-center tracking-wider uppercase border border-black/20"
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
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                            </div>

                            {task.checklist && task.checklist.length > 0 && (
                                <div className="flex items-center gap-1 opacity-80 group-hover/inner:opacity-100 transition-opacity" title="Progresso do Checklist">
                                    <CheckSquare size={10} className={
                                        task.checklist.every(item => item.completed) ? "text-emerald-500" : ""
                                    } />
                                    <span className={cn(
                                        "font-mono text-[9px]",
                                        task.checklist.every(item => item.completed) ? "text-emerald-500 font-bold" : ""
                                    )}>
                                        {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                                    </span>
                                </div>
                            )}

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
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-none bg-[var(--background)] border border-[var(--border)] group-hover/inner:border-[var(--primary)]/50 transition-colors" title={task.assignee}>
                                <User size={10} className="text-[var(--primary)]" />
                                <span className="max-w-[80px] truncate font-mono tracking-tighter">{task.assignee.split(' ')[0]}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
