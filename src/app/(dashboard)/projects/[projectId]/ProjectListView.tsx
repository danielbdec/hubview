import { useMemo } from 'react';
import { Table, Progress, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Column, Task } from '@/store/kanbanStore';
import { AlertCircle, AlertTriangle, ArrowDown, User, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from '@/components/ui/ThemeProvider';
import { getReadableTextColor } from '@/lib/color';

interface ProjectListViewProps {
    columns: Column[];
    onEditTask: (task: Task) => void;
}

type TaskRow = Task & {
    columnName: string;
    columnColor: string;
    columnDone: boolean;
};

export default function ProjectListView({ columns, onEditTask }: ProjectListViewProps) {
    const { theme: themeMode } = useTheme();
    const flatData = useMemo<TaskRow[]>(() => {
        const tasks: TaskRow[] = [];
        columns.forEach(col => {
            col.tasks.forEach(task => {
                tasks.push({
                    ...task,
                    columnName: col.title,
                    columnColor: col.color || 'var(--primary)',
                    columnDone: col.isDone || false
                });
            });
        });
        return tasks;
    }, [columns]);

    const tableColumns: ColumnsType<TaskRow> = [
        {
            title: 'TÍTULO',
            dataIndex: 'content',
            key: 'content',
            render: (text, record) => (
                <div className="font-bold hover:text-[var(--primary)] transition-colors flex items-center gap-2">
                    {record.columnDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {text}
                </div>
            ),
        },
        {
            title: 'ETAPA',
            dataIndex: 'columnName',
            key: 'columnName',
            render: (text, record) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: record.columnColor }} />
                    <span className="text-xs font-mono uppercase tracking-wider">{text}</span>
                </div>
            ),
        },
        {
            title: 'PRIORIDADE',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority) => {
                if (priority === 'high') return <span className="text-red-500 font-mono text-xs uppercase flex items-center gap-1"><AlertCircle size={12} /> Alta</span>;
                if (priority === 'medium') return <span className="text-amber-500 font-mono text-xs uppercase flex items-center gap-1"><AlertTriangle size={12} /> Média</span>;
                return <span className="text-emerald-500 font-mono text-xs uppercase flex items-center gap-1"><ArrowDown size={12} /> Baixa</span>;
            },
            sorter: (a, b) => {
                const map: Record<Task['priority'], number> = { low: 1, medium: 2, high: 3 };
                return (map[a.priority] || 0) - (map[b.priority] || 0);
            }
        },
        {
            title: 'RESPONSÁVEL',
            dataIndex: 'assignee',
            key: 'assignee',
            render: (assignee) => assignee ? (
                <div className="flex items-center gap-1 text-xs font-mono">
                    <User size={12} className="text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">{assignee}</span>
                </div>
            ) : <span className="text-[var(--muted-foreground)] text-xs font-mono">Não atribuído</span>,
        },
        {
            title: 'TAGS',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags: { id: string, name: string, color: string }[]) => (
                <div className="flex gap-1 flex-wrap">
                    {tags?.map(t => (
                        <span
                            key={t.id}
                            className="rounded-none border border-black/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest leading-none"
                            style={{ backgroundColor: t.color, color: getReadableTextColor(t.color) }}
                        >
                            {t.name}
                        </span>
                    ))}
                </div>
            )
        },
        {
            title: 'PRAZO',
            key: 'dates',
            render: (_, record) => {
                const formatDate = (dateString: string) => {
                    const datePart = dateString.split('T')[0];
                    return dayjs(datePart).format('DD/MM/YY');
                };

                const start = record.startDate ? formatDate(record.startDate) : null;
                const end = record.endDate ? formatDate(record.endDate) : null;

                if (!start && !end) return <span className="text-[var(--muted-foreground)] text-xs font-mono">-</span>;

                const isLate = record.endDate && dayjs(record.endDate.split('T')[0]).isBefore(dayjs().startOf('day')) && !record.columnDone;

                return (
                    <span className={`text-xs font-mono ${isLate ? 'text-red-500 font-bold' : 'text-[var(--muted-foreground)]'}`}>
                        {start ? start : '-'} ➔ {end ? end : '-'}
                    </span>
                );
            }
        },
        {
            title: 'CHECKLIST',
            key: 'checklist',
            render: (_, record) => {
                if (!record.checklist || record.checklist.length === 0) return null;
                const total = record.checklist.length;
                const completed = record.checklist.filter((item) => item.completed).length;
                const percent = Math.round((completed / total) * 100);
                return (
                    <Tooltip title={`${completed}/${total} itens concluídos`}>
                        <Progress
                            percent={percent}
                            size="small"
                            strokeColor={percent === 100 ? '#10b981' : 'var(--primary)'}
                            trailColor="var(--input-border)"
                            className="w-24 m-0 [&_.ant-progress-text]:!text-[10px] [&_.ant-progress-text]:!font-mono [&_.ant-progress-text]:!text-[var(--foreground)]"
                        />
                    </Tooltip>
                );
            }
        }
    ];

    return (
        <ConfigProvider
            theme={{
                algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                token: {
                    fontFamily: 'var(--font-sans)',
                    colorBgContainer: 'var(--card)',
                    colorBorderSecondary: 'var(--card-border)',
                    colorBgElevated: 'var(--sidebar)',
                    colorText: 'var(--foreground)',
                    colorTextSecondary: 'var(--muted-foreground)',
                    borderRadius: 0,
                },
                components: {
                    Table: {
                        headerBg: 'var(--column-bg)',
                        headerColor: 'var(--muted-foreground)',
                        rowHoverBg: 'var(--card-hover)',
                    }
                }
            }}
        >
            <div className="flex-1 overflow-auto rounded-none border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--surface-shadow-soft)]">
                <Table
                    columns={tableColumns}
                    dataSource={flatData}
                    rowKey="id"
                    pagination={false}
                    onRow={(record) => ({
                        onClick: () => onEditTask(record),
                        className: 'cursor-pointer hover:bg-[var(--card-hover)] transition-colors'
                    })}
                    className="font-mono text-sm [&_.ant-table-thead_th]:!font-mono [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!tracking-widest [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[var(--card-border)] [&_.ant-table-tbody_td]:!border-b [&_.ant-table-tbody_td]:!border-[var(--card-border)]"
                />
            </div>
        </ConfigProvider>
    );
}
