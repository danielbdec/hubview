import { useMemo } from 'react';
import { Calendar, ConfigProvider, theme as antdTheme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/pt-br';
import { Column, Task } from '@/store/kanbanStore';
import { AlertCircle, AlertTriangle, ArrowDown, User, CheckSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '@/components/ui/ThemeProvider';
import { getReadableTextColor } from '@/lib/color';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const PriorityIcon = ({ priority }: { priority: string }) => {
    switch (priority) {
        case 'high': return <AlertCircle size={10} className="text-red-500" />;
        case 'medium': return <AlertTriangle size={10} className="text-amber-500" />;
        case 'low': return <ArrowDown size={10} className="text-emerald-500" />;
        default: return null;
    }
};

dayjs.extend(localeData);
dayjs.locale('pt-br');

interface ProjectCalendarViewProps {
    columns: Column[];
    onEditTask: (task: Task) => void;
}

export default function ProjectCalendarView({ columns, onEditTask }: ProjectCalendarViewProps) {
    const { theme: themeMode } = useTheme();
    const tasksByDate = useMemo(() => {
        const map = new Map<string, (Task & { columnColor: string })[]>();
        columns.forEach(col => {
            col.tasks.forEach(task => {
                const dateKeys = new Set<string>();
                const safeParseDate = (dString: string) => dayjs(dString.split('T')[0]);
                // Only map tasks that have explicit start/end dates
                if (task.startDate) dateKeys.add(safeParseDate(task.startDate).format('YYYY-MM-DD'));
                if (task.endDate) dateKeys.add(safeParseDate(task.endDate).format('YYYY-MM-DD'));

                // If a task spans multiple days, we could populate them all, but for simplicity we only mark start and end
                // or if it has only one date. Let's populate the full range.
                if (task.startDate && task.endDate) {
                    let current = safeParseDate(task.startDate);
                    const end = safeParseDate(task.endDate);
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
            <div className="w-full h-full min-h-[120px] relative flex flex-col pt-1">
                <div className="text-right p-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[var(--foreground)] opacity-70">
                        {value.date()}
                    </span>
                </div>
                <ul className="m-0 p-0 pb-2 list-none flex-1 overflow-y-auto scrollbar-none space-y-1.5 flex flex-col items-center w-full">
                    {dayTasks.map((task, idx) => (
                        <li key={`${task.id}-${dateStr}-${idx}`} className="w-full flex justify-center" onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                            <div className="group/calcard flex w-[96%] cursor-pointer flex-col gap-1.5 border-l-[3px] bg-[var(--card)] p-1.5 font-sans leading-tight shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--card-hover)]"
                                style={{ borderColor: task.columnColor, color: 'var(--foreground)' }}
                                title={task.content}
                            >
                                <div className="text-[11px] font-medium truncate">{task.content}</div>

                                {/* Tags (Top Row) */}
                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {task.tags.slice(0, 2).map((tag, tagIdx) => (
                                            <span
                                                key={`${tag.id}-${tagIdx}`}
                                                className="flex max-w-[60px] items-center truncate border border-black/10 px-1 py-[1px] text-[8px] font-mono font-bold uppercase tracking-wider"
                                                style={{ backgroundColor: tag.color, color: getReadableTextColor(tag.color) }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                        {task.tags.length > 2 && <span className="text-[8px] font-mono opacity-50 self-center">+{task.tags.length - 2}</span>}
                                    </div>
                                )}

                                {/* Footer Options */}
                                <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <PriorityIcon priority={task.priority} />
                                        {task.checklist && task.checklist.length > 0 && (
                                            <div className="flex items-center gap-0.5 opacity-70 group-hover/calcard:opacity-100" title="Checklist">
                                                <CheckSquare size={8} className={
                                                    task.checklist.every(item => item.completed) ? "text-emerald-500" : "text-[var(--muted-foreground)]"
                                                } />
                                                <span className={cn(
                                                    "font-mono text-[8px]",
                                                    task.checklist.every(item => item.completed) ? "text-emerald-500 font-bold" : "text-[var(--muted-foreground)]"
                                                )}>
                                                    {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {task.assignee && task.assignee !== 'Unassigned' && (
                                        <div className="flex items-center gap-1 rounded-none border border-[var(--card-border)] bg-[var(--background)] px-1 py-0.5 group-hover/calcard:border-[var(--primary)]" title={task.assignee}>
                                            <User size={8} className="text-[var(--primary)]" />
                                            <span className="max-w-[40px] truncate font-mono tracking-tighter text-[9px] text-[var(--muted-foreground)]">{task.assignee.split(' ')[0]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <ConfigProvider
            locale={ptBR}
            theme={{
                algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                token: {
                    fontFamily: 'var(--font-sans)',
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
                    },
                    Radio: {
                        colorPrimary: 'var(--primary)',
                        buttonBg: 'transparent',
                        buttonCheckedBg: 'var(--primary)',
                        buttonColor: 'var(--muted-foreground)',
                        buttonSolidCheckedColor: '#000000',
                        buttonSolidCheckedBg: 'var(--primary)',
                        buttonSolidCheckedHoverBg: 'var(--primary)',
                    }
                }
            }}
        >
            <div className="brutalist-calendar flex-1 overflow-auto rounded-none border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--surface-shadow-soft)] [&_.ant-radio-button-wrapper-checked]:!font-bold [&_.ant-radio-button-wrapper-checked]:!text-black">
                <Calendar
                    cellRender={(current, info) => {
                        if (info.type === 'date') return dateCellRender(current);
                        return info.originNode;
                    }}
                    className={cn(
                        "[&_.ant-picker-cell]:!p-0",
                        "[&_.ant-picker-cell-inner]:!p-0 [&_.ant-picker-cell-inner]:!m-0",
                        "[&_.ant-picker-calendar-date]:!p-0 [&_.ant-picker-calendar-date]:!m-0 [&_.ant-picker-calendar-date]:!w-full",
                        "[&_.ant-picker-calendar-date-content]:!p-0 [&_.ant-picker-calendar-date-content]:!m-0 [&_.ant-picker-calendar-date-content]:!w-full [&_.ant-picker-calendar-date-content]:!h-full [&_.ant-picker-calendar-date-content]:!overflow-hidden",
                        "[&_.ant-picker-calendar-date-value]:!hidden",
                        "[&_.ant-picker-panel]:!bg-transparent",
                        "[&_.ant-picker-cell-in-view.ant-picker-cell-today_.ant-picker-calendar-date]:!border-[var(--primary)] [&_.ant-picker-cell-in-view.ant-picker-cell-today_.ant-picker-calendar-date]:!border [&_.ant-picker-cell-in-view.ant-picker-cell-today_.ant-picker-calendar-date]:!bg-[var(--primary)]/5"
                    )}
                />
            </div>
        </ConfigProvider>
    );
}
