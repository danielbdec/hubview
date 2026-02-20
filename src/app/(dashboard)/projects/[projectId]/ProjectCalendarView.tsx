import React, { useMemo } from 'react';
import { Calendar, ConfigProvider, theme } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import { Column, Task } from '@/store/kanbanStore';

dayjs.extend(localeData);

interface ProjectCalendarViewProps {
    columns: Column[];
    onEditTask: (task: Task) => void;
}

export default function ProjectCalendarView({ columns, onEditTask }: ProjectCalendarViewProps) {
    const tasksByDate = useMemo(() => {
        const map = new Map<string, (Task & { columnColor: string })[]>();
        columns.forEach(col => {
            col.tasks.forEach(task => {
                const dateKeys = new Set<string>();
                // Only map tasks that have explicit start/end dates
                if (task.startDate) dateKeys.add(dayjs(task.startDate).format('YYYY-MM-DD'));
                if (task.endDate) dateKeys.add(dayjs(task.endDate).format('YYYY-MM-DD'));

                // If a task spans multiple days, we could populate them all, but for simplicity we only mark start and end
                // or if it has only one date. Let's populate the full range.
                if (task.startDate && task.endDate) {
                    let current = dayjs(task.startDate);
                    const end = dayjs(task.endDate);
                    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
                        dateKeys.add(current.format('YYYY-MM-DD'));
                        current = current.add(1, 'day');
                    }
                }

                dateKeys.forEach(dateStr => {
                    if (!map.has(dateStr)) map.set(dateStr, []);
                    map.get(dateStr)!.push({ ...task, columnColor: col.color || 'var(--primary)' });
                });
            });
        });
        return map;
    }, [columns]);

    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const dayTasks = tasksByDate.get(dateStr) || [];

        return (
            <div className="w-full h-full min-h-[100px] relative flex flex-col">
                <div className="text-right p-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[var(--foreground)] opacity-70">
                        {value.date()}
                    </span>
                </div>
                <ul className="m-0 px-1 pb-1 list-none flex-1 overflow-y-auto scrollbar-none space-y-1">
                    {dayTasks.map(task => (
                        <li key={`${task.id}-${dateStr}`} onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                            <div className="text-[10px] font-mono leading-tight truncate px-1.5 py-1 border-l-2 cursor-pointer hover:bg-[var(--card-hover)] transition-colors bg-[var(--background)]/80 backdrop-blur-sm shadow-sm"
                                style={{ borderColor: task.columnColor, color: 'var(--foreground)' }}
                                title={task.content}
                            >
                                {task.content}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    fontFamily: 'var(--font-geist-sans)',
                    colorBgContainer: 'var(--card)',
                    colorBorderSecondary: 'var(--card-border)',
                    colorSplit: 'var(--card-border)',
                    colorText: 'var(--foreground)',
                    colorTextHeading: 'var(--foreground)',
                    colorTextDisabled: 'var(--muted-foreground)',
                    borderRadius: 0,
                    colorPrimary: 'var(--primary)',
                    controlItemBgActive: 'var(--card-hover)',
                    lineWidth: 1,
                },
                components: {
                    Calendar: {
                        fullBg: 'var(--card)',
                        itemActiveBg: 'var(--primary)',
                    }
                }
            }}
        >
            <div className="flex-1 overflow-auto bg-[var(--card)] p-4 border border-[var(--card-border)] rounded-none brutalist-calendar">
                <Calendar
                    cellRender={(current, info) => {
                        if (info.type === 'date') return dateCellRender(current);
                        return info.originNode;
                    }}
                    className="[&_.ant-picker-calendar-date]:!p-0 [&_.ant-picker-calendar-date-value]:!hidden [&_.ant-picker-panel]:!bg-transparent"
                />
            </div>
        </ConfigProvider>
    );
}
