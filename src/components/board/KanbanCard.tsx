'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { GripVertical, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Task = { id: string; content: string; tag: string; priority: 'low' | 'medium' | 'high' };

interface KanbanCardProps {
    task: Task;
    isOverlay?: boolean;
    onEdit?: (task: Task) => void;
}

export function KanbanCard({ task, isOverlay, onEdit }: KanbanCardProps) {
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
                className="opacity-30 h-[120px] bg-white/5 border border-dashed border-white/20 rounded-none"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn("touch-none")}
        >
            <Card
                variant={isOverlay ? "glass" : "default"}
                className={cn(
                    "p-4 group relative transition-all hover:border-tech-green/30",
                    isOverlay && "border-tech-green shadow-[0_0_20px_-5px_rgba(169,239,47,0.3)] scale-105 rotate-2 z-50",
                    !isOverlay && "hover:-translate-y-1"
                )}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${task.priority === 'high' ? 'border-tech-red text-tech-red' :
                        task.priority === 'medium' ? 'border-tech-yellow text-tech-yellow' :
                            'border-gray-500 text-gray-500'
                        }`}>
                        {task.priority.toUpperCase()}
                    </span>
                    <div className="flex gap-2 items-center">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                            className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Editar"
                        >
                            <Edit2 size={12} />
                        </button>
                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded">
                            <GripVertical size={14} className={cn("text-gray-700 transition-opacity",
                                isOverlay ? "opacity-100 text-tech-green" : "opacity-0 group-hover:opacity-100 group-hover:text-gray-400"
                            )} />
                        </div>
                    </div>
                </div>
                <p
                    className={cn("text-sm font-medium mb-3 transition-colors cursor-pointer",
                        isOverlay ? "text-white" : "text-gray-200 group-hover:text-white"
                    )}>
                    {task.content}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1">{task.tag}</span>
                    <div className={cn("w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/10",
                        isOverlay && "border-tech-green"
                    )} />
                </div>
            </Card>
        </div>
    );
}
