import React, { useMemo } from 'react';
import { Table, Tag, Progress, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Column, Task } from '@/store/kanbanStore';
import { AlertCircle, AlertTriangle, ArrowDown, User, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import { ConfigProvider, theme } from 'antd';

interface ProjectListViewProps {
    columns: Column[];
    onEditTask: (task: Task) => void;
}

export default function ProjectListView({ columns, onEditTask }: ProjectListViewProps) {
    const flatData = useMemo(() => {
        const tasks: (Task & { columnName: string, columnColor: string, columnDone: boolean })[] = [];
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

    const tableColumns: ColumnsType<any> = [
        {
            title: 'TÍTULO',
            dataIndex: 'content',
            key: 'content',
            render: (text, record) => (
                <div
                    className="font-bold cursor-pointer hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                    onClick={() => onEditTask(record)}
                >
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
                const map: any = { low: 1, medium: 2, high: 3 };
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
                        <span key={t.id} className="px-1.5 py-0.5 text-[9px] font-mono border border-black/20 text-white uppercase tracking-widest leading-none rounded-none" style={{ backgroundColor: t.color }}>
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
                const start = record.startDate ? dayjs(record.startDate).format('DD/MM/YY') : null;
                const end = record.endDate ? dayjs(record.endDate).format('DD/MM/YY') : null;
                if (!start && !end) return <span className="text-[var(--muted-foreground)] text-xs font-mono">-</span>;

                const isLate = record.endDate && dayjs(record.endDate).isBefore(dayjs(), 'day') && !record.columnDone;

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
                const completed = record.checklist.filter((i: any) => i.completed).length;
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
                algorithm: theme.darkAlgorithm,
                token: {
                    fontFamily: 'var(--font-geist-sans)',
                    colorBgContainer: 'var(--card)',
                    colorBorderSecondary: 'var(--card-border)',
                    borderRadius: 0,
                },
                components: {
                    Table: {
                        headerBg: 'var(--sidebar)',
                        headerColor: 'var(--muted-foreground)',
                        rowHoverBg: 'var(--card-hover)',
                    }
                }
            }}
        >
            <div className="flex-1 overflow-auto bg-[var(--card)] p-4 border border-[var(--card-border)] rounded-none">
                <Table
                    columns={tableColumns}
                    dataSource={flatData}
                    rowKey="id"
                    pagination={false}
                    className="font-mono text-sm [&_.ant-table-thead_th]:!font-mono [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!tracking-widest [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[var(--card-border)] [&_.ant-table-tbody_td]:!border-b [&_.ant-table-tbody_td]:!border-[var(--card-border)]"
                />
            </div>
        </ConfigProvider>
    );
}
