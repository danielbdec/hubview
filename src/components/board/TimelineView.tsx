'use client';

import React, { useMemo, useState } from 'react';
import { Column, Task } from '@/store/kanbanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addDays, startOfDay, endOfDay, isBefore, isAfter, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DecodingText } from '@/components/auth/LoginEffects';

const hexToRgba = (hexColor: string, alpha: number): string => {
    let rawHex = (hexColor || '').replace('#', '').trim();
    // Se for uma variável css ou classe tailwind, não conseguimos fazer o parse em runtime facilmente aqui
    // Então caímos para o verde neon padrão:
    if (!/^[0-9A-Fa-f]{3,6}$/.test(rawHex)) {
        return `rgba(169, 239, 47, ${alpha})`; 
    }
    if (rawHex.length === 3) rawHex = rawHex.split('').map(c => c+c).join('');
    
    const r = parseInt(rawHex.substring(0, 2), 16);
    const g = parseInt(rawHex.substring(2, 4), 16);
    const b = parseInt(rawHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface TimelineViewProps {
    columns: Column[];
    onEditTask: (task: Task) => void;
}

export default function TimelineView({ columns, onEditTask }: TimelineViewProps) {
    // 1. Extract all tasks and filter out those completely missing dates
    const allTasks = useMemo(() => {
        const tasks: Task[] = [];
        columns.forEach(col => {
            col.tasks?.forEach(t => {
                tasks.push({ ...t, _columnColor: col.color, _isDone: col.isDone } as Task & { _columnColor?: string; _isDone?: boolean });
            });
        });
        return tasks;
    }, [columns]);

    const scheduledTasks = allTasks.filter(t => t.startDate || t.endDate);

    // 2. Find min and max dates perfectly
    const { minDate, maxDate } = useMemo(() => {
        let min = new Date();
        let max = new Date();
        let hasDates = false;

        scheduledTasks.forEach(t => {
            if (t.startDate) {
                const s = new Date(t.startDate);
                if (!hasDates || isBefore(s, min)) min = s;
                hasDates = true;
            }
            if (t.endDate) {
                const e = new Date(t.endDate);
                if (!hasDates || isAfter(e, max)) max = e;
                hasDates = true;
            }
        });

        // Add some padding to the timeline (7 days before, 14 days after)
        if (hasDates) {
            min = startOfDay(addDays(min, -7));
            max = endOfDay(addDays(max, 14));
        } else {
            // Default span if no tasks are scheduled
            min = startOfDay(addDays(new Date(), -7));
            max = endOfDay(addDays(new Date(), 21));
        }

        return { minDate: min, maxDate: max };
    }, [scheduledTasks]);

    const totalDays = differenceInDays(maxDate, minDate);

    // 3. Generate array of days for the x-axis headers
    const daysArray = useMemo(() => {
        const arr = [];
        for (let i = 0; i <= totalDays; i++) {
            arr.push(addDays(minDate, i));
        }
        return arr;
    }, [minDate, totalDays]);

    const calculateLeftPercentage = (dateStr?: string) => {
        if (!dateStr) return 0;
        const d = new Date(dateStr);
        if (isBefore(d, minDate)) return 0;
        const diff = differenceInDays(d, minDate);
        return (diff / totalDays) * 100;
    };

    const calculateWidthPercentage = (startStr?: string, endStr?: string) => {
        const start = startStr ? new Date(startStr) : minDate;
        const end = endStr ? new Date(endStr) : addDays(start, 1);
        
        let safeStart = isBefore(start, minDate) ? minDate : start;
        let safeEnd = isAfter(end, maxDate) ? maxDate : end;
        
        if (isBefore(safeEnd, safeStart)) {
            safeEnd = addDays(safeStart, 1);
        }

        const duration = differenceInDays(safeEnd, safeStart) || 1; // Minimum 1 day wide
        return (duration / totalDays) * 100;
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full bg-transparent">
            {/* Cinematic Perspective Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-20 mix-blend-screen"
                style={{
                    backgroundImage: `linear-gradient(var(--card-border) 1px, transparent 1px), linear-gradient(90deg, var(--card-border) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    transform: 'perspective(1000px) rotateX(60deg) scale(2.5) translateY(-20%)',
                    transformOrigin: 'top center',
                }}
            />

            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] relative z-10 flex items-center justify-between bg-[var(--card)]/50 backdrop-blur-xl">
                <div>
                    <h2 className="font-mono text-sm uppercase tracking-[0.2em] font-bold text-[var(--foreground)]">
                        <DecodingText text="Timeline" />
                    </h2>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase tracking-wider mt-1">
                        Mapeamento de Espectro Temporal
                    </p>
                </div>
            </div>

            {/* Timeline Scrollable Area */}
            <div className="flex-1 overflow-auto w-full relative z-10 custom-scrollbar">
                <div 
                    className="min-w-max relative pb-32" 
                    style={{ minWidth: `${Math.max(100, totalDays * 2)}%` }} // Adjust zoom level essentially
                >
                    
                    {/* Time Axis Header */}
                    <div className="sticky top-0 z-20 flex h-10 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
                        {daysArray.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div 
                                    key={idx} 
                                    className="flex-1 flex flex-col items-center justify-center min-w-[40px] border-r border-[var(--border)]/50 relative"
                                    style={{ width: `${100 / totalDays}%` }}
                                >
                                    <span className={`text-[9px] font-mono tracking-tighter ${isToday ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted-foreground)]'}`}>
                                        {format(day, 'dd/MM')}
                                    </span>
                                    {isToday && (
                                        <div className="absolute bottom-0 w-full h-0.5 bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Today Vertical Guideline */}
                    <div 
                        className="absolute top-0 bottom-0 w-px bg-[var(--primary)]/30 z-0 pointer-events-none shadow-[0_0_12px_rgba(169,239,47,0.4)]"
                        style={{ left: `${calculateLeftPercentage(new Date().toISOString())}%` }}
                    />

                    {/* Tasks Tracks */}
                    <div className="pt-4 flex flex-col gap-3 px-2">
                        {scheduledTasks.length === 0 && (
                            <div className="w-full text-center py-20 text-[var(--muted-foreground)] font-mono text-xs uppercase tracking-widest">
                                Nenhuma tarefa com data agendada encontrada.
                            </div>
                        )}
                        
                        <AnimatePresence>
                            {scheduledTasks.map((task, index) => {
                                const left = calculateLeftPercentage(task.startDate);
                                const width = calculateWidthPercentage(task.startDate, task.endDate);
                                const isHighPriority = task.priority === 'high';
                                
                                // FORCE High Contrast specific colors for Timeline visibility
                                const neonMap: any = {
                                    high: '#ff1493', // Deep Pink Neon
                                    medium: '#00ffff', // Cyan Neon
                                    low: '#a9ef2f' // Lime Green Neon
                                };
                                const color = neonMap[task.priority] || '#a9ef2f';
                                
                                const rawIsDone = (task as any)._isDone;
                                const isDone = rawIsDone === true || rawIsDone === 'true' || rawIsDone === 'Sim' || rawIsDone === 1;

                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                        transition={{ duration: 0.5, delay: index * 0.05, type: 'spring', bounce: 0.4 }}
                                        className="relative h-10 group cursor-pointer"
                                        onClick={() => onEditTask(task)}
                                    >
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-sm transition-all duration-300 hover:h-10 hover:brightness-150 z-10"
                                            style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                background: isDone 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : `linear-gradient(90deg, ${hexToRgba(color, 0.5)}, ${color})`,
                                                border: `1px solid ${isDone ? 'rgba(255,255,255,0.2)' : color}`,
                                                boxShadow: isDone ? 'none' : `0 0 20px ${hexToRgba(color, 0.8)}, inset 0 0 10px ${hexToRgba(color, 0.6)}`,
                                                opacity: isDone ? 0.6 : 1
                                            }}
                                        >
                                            {/* Neon Edge Highlight */}
                                            {!isDone && (
                                                <div className="absolute inset-0 rounded-sm opacity-100 mix-blend-overlay" style={{ boxShadow: `inset 0 1px 3px rgba(255,255,255,1)` }} />
                                            )}
                                            
                                            <div className="hidden group-hover:block absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-md backdrop-blur-xl shadow-2xl z-50">
                                                <span className="text-xs font-bold text-white block">{task.content}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase">
                                                        {task.startDate ? format(new Date(task.startDate), 'dd/MM/yy') : 'N/A'} - {task.endDate ? format(new Date(task.endDate), 'dd/MM/yy') : 'N/A'}
                                                    </span>
                                                    {isHighPriority && <span className="text-[9px] font-bold text-red-500 uppercase font-mono bg-red-500/10 px-1 rounded">Crit</span>}
                                                </div>
                                            </div>

                                            {/* Trimmed content text inside the bar if width allows */}
                                            <div className="absolute inset-0 px-2 flex items-center overflow-hidden">
                                                <span className="text-[10px] whitespace-nowrap font-bold text-white drop-shadow-md truncate font-sans tracking-tight">
                                                    {task.content}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

