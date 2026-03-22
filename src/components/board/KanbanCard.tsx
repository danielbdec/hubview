'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { Edit2, Clock, Trash2, User, AlertCircle, AlertTriangle, ArrowDown, CheckSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task } from '@/store/kanbanStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import { getSlaStatus } from '@/lib/sla';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface KanbanCardProps {
    task: Task;
    isOverlay?: boolean;
    columnId?: string;
    isDoneColumn?: boolean;
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

const PRIORITY_LABELS = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
} as const;

const PRIORITY_STYLES = {
    high: 'border-red-500/25 bg-red-500/10 text-red-300',
    medium: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    low: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
} as const;

function formatTaskDate(date?: string) {
    if (!date) return null;

    const parts = date.split(/[-T]/);
    if (parts.length >= 3) {
        const parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function KanbanCard({ task, isOverlay, columnId, isDoneColumn, onEdit, onDelete }: KanbanCardProps) {
    const { theme: themeMode } = useTheme();
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
                className="opacity-30 h-[176px] bg-[var(--card)] border border-dashed border-[var(--primary)] rounded-none"
            />
        );
    }

    const priorityLabel = PRIORITY_LABELS[task.priority];
    const priorityTone = themeMode === 'light'
        ? {
            high: 'border-red-500/20 bg-red-500/10 text-red-600',
            medium: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
            low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
        }[task.priority]
        : PRIORITY_STYLES[task.priority];
    const startDateLabel = formatTaskDate(task.startDate);
    const endDateLabel = formatTaskDate(task.endDate);
    const hasTimeline = !!(startDateLabel || endDateLabel);
    const description = task.description?.trim();
    const checklistItems = task.checklist || [];
    const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
    const hasChecklist = checklistItems.length > 0;
    const isChecklistDone = hasChecklist && completedChecklistCount === checklistItems.length;
    const primaryAssignee = task.assignee && task.assignee !== 'Unassigned'
        ? task.assignee.split(' ')[0]
        : null;

    const slaStatus = isDoneColumn ? null : getSlaStatus(task.endDate);

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
                    "p-0 transition-all bg-[var(--card)] border border-[var(--card-border)] rounded-none flex flex-col gap-0 relative group/inner min-h-[176px] overflow-hidden",
                    // Sharp geometry & active physical tension shadow
                    !isOverlay && "hover:-translate-y-1 hover:translate-x-[-2px] hover:shadow-[4px_4px_0_0_var(--primary)] cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50",
                    isOverlay && "border border-[var(--primary)] shadow-[8px_8px_0_0_var(--primary)] scale-105 z-50 cursor-grabbing bg-[var(--background)]",
                    task.syncStatus === 'syncing' && "after:absolute after:top-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-amber-400 after:animate-pulse",
                    slaStatus === 'overdue' && "ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-500/5 border-red-500/30"
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

                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,transparent)] opacity-80 pointer-events-none" />

                <div className="p-4 flex flex-col gap-3.5 min-h-[175px]">
                    {/* Hover Actions (Absolute Top Right) */}
                    <div className={cn(
                        "absolute top-3 right-3 flex gap-1 transform translate-x-2 opacity-0 group-hover/inner:translate-x-0 group-hover/inner:opacity-100 transition-all duration-200 z-10 bg-[var(--background)]/90 border border-[var(--card-border)] rounded-none pl-1 pr-1 py-1 backdrop-blur-sm"
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

                    <div className="flex flex-wrap items-center gap-2 pr-12">
                        <div
                            className={cn(
                                "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.24em]",
                                priorityTone
                            )}
                            title={`Prioridade: ${priorityLabel}`}
                        >
                            <PriorityIcon priority={task.priority} />
                            <span>{priorityLabel}</span>
                        </div>

                        {hasChecklist && (
                            <div
                                className={cn(
                                    "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em]",
                                    isChecklistDone
                                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                                        : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--muted-foreground)]"
                                )}
                                title="Progresso do Checklist"
                            >
                                <CheckSquare size={11} className={isChecklistDone ? "text-emerald-400" : "text-[var(--muted-foreground)]"} />
                                <span>
                                    Checklist {completedChecklistCount}/{checklistItems.length}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[16px] font-semibold leading-6 text-[var(--foreground)] break-words pr-8 line-clamp-2 tracking-[-0.01em]">
                            {task.content}
                        </p>

                        {description && (
                            <p className="text-[12px] leading-5 text-[var(--muted-foreground)] break-words pr-3 line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {task.tags.map((tag, idx) => (
                                <span
                                    key={`${tag.id}-${idx}`}
                                    className="inline-flex items-center rounded-none border px-2.5 py-1 text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-white shadow-[0_0_12px_rgba(0,0,0,0.12)]"
                                    style={{
                                        backgroundColor: `${tag.color}33`,
                                        borderColor: `${tag.color}66`,
                                        color: tag.color,
                                    }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-[var(--card-border)]/60 pt-3 text-[10px] text-[var(--muted-foreground)]">
                        <div className="flex flex-wrap items-center gap-2">
                            {hasTimeline && (
                                <div
                                    className={cn(
                                        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]",
                                        slaStatus === 'overdue' ? "border-red-500/50 bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
                                        slaStatus === 'warning' ? "border-amber-500/40 bg-amber-500/10 text-amber-500" :
                                        slaStatus === 'on-track' ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" :
                                        "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--muted-foreground)]"
                                    )}
                                    title="Data Prevista"
                                >
                                    <Clock size={11} className="currentColor" />
                                    <span>
                                        {startDateLabel || '..'} - {endDateLabel || '..'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {primaryAssignee && (
                            <div
                                className="inline-flex items-center gap-1.5 border border-[var(--card-border)] bg-[var(--background)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors group-hover/inner:border-[var(--primary)]/40"
                                title={task.assignee}
                            >
                                <User size={11} className="text-[var(--primary)]" />
                                <span className="max-w-[120px] truncate text-[var(--foreground)]">
                                    {primaryAssignee}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
