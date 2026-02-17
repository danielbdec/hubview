import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';

export type Task = {
    id: string;
    content: string;
    description?: string;
    tag: string;
    priority: 'low' | 'medium' | 'high';
    checklist?: { id: string; text: string; completed: boolean; }[];
};

export type Column = { id: string; title: string; tasks: Task[] };

interface KanbanState {
    columns: Column[];
    addColumn: () => void;
    deleteColumn: (id: string) => void;
    updateColumnTitle: (id: string, title: string) => void;
    addTask: (columnId: string, task: Omit<Task, 'id'>) => string;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveColumn: (activeId: string, overId: string) => void;
    moveTask: (activeId: string, overId: string, activeColId: string | null, overColId: string | null) => void;
    setColumns: (columns: Column[]) => void;
}

const initialColumns: Column[] = [
    {
        id: 'backlog',
        title: 'BACKLOG',
        tasks: [
            { id: uuidv4(), content: 'Implementar Autenticação', description: 'Usar NextAuth com Google Provider', tag: 'Backend', priority: 'high' },
            { id: uuidv4(), content: 'Auditoria de Design System', tag: 'Design', priority: 'medium' },
            { id: uuidv4(), content: 'Schema do Banco de Dados', tag: 'Backend', priority: 'high' },
        ],
    },
    {
        id: 'in-progress',
        title: 'EM PROGRESSO',
        tasks: [
            { id: uuidv4(), content: 'Analytics do Dashboard', tag: 'Frontend', priority: 'high' },
        ],
    },
    {
        id: 'review',
        title: 'CODE REVIEW',
        tasks: [
            { id: uuidv4(), content: 'Refatorar API', tag: 'Backend', priority: 'medium' },
        ],
    },
    {
        id: 'done',
        title: 'CONCLUÍDO',
        tasks: [
            { id: uuidv4(), content: 'Configuração do Projeto', tag: 'DevOps', priority: 'low' },
        ],
    },
];

export const useKanbanStore = create<KanbanState>()(
    persist(
        (set) => ({
            columns: initialColumns,
            addColumn: () => set((state) => ({
                columns: [...state.columns, { id: uuidv4(), title: 'NOVA ETAPA', tasks: [] }]
            })),
            deleteColumn: (id) => set((state) => ({
                columns: state.columns.filter((col) => col.id !== id)
            })),
            updateColumnTitle: (id, title) => set((state) => ({
                columns: state.columns.map((col) => col.id === id ? { ...col, title } : col)
            })),
            addTask: (columnId, task) => {
                const newId = uuidv4();
                set((state) => ({
                    columns: state.columns.map((col) => {
                        if (col.id === columnId) {
                            return { ...col, tasks: [...col.tasks, { ...task, id: newId }] };
                        }
                        return col;
                    })
                }));
                return newId;
            },
            updateTask: (taskId, updates) => set((state) => ({
                columns: state.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t)
                }))
            })),
            deleteTask: (taskId) => set((state) => ({
                columns: state.columns.map((col) => ({
                    ...col,
                    tasks: col.tasks.filter((t) => t.id !== taskId)
                }))
            })),
            moveColumn: (activeId, overId) => set((state) => {
                const activeIndex = state.columns.findIndex((col) => col.id === activeId);
                const overIndex = state.columns.findIndex((col) => col.id === overId);
                return { columns: arrayMove(state.columns, activeIndex, overIndex) };
            }),
            moveTask: (activeId, overId, activeColId, overColId) => set((state) => {
                const activeColumn = state.columns.find(col => col.id === activeColId);
                const overColumn = state.columns.find(col => col.id === overColId);

                if (!activeColumn || !overColumn) return state;

                if (activeColumn.id === overColumn.id) {
                    // Same column reorder
                    const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
                    const overIndex = overColumn.tasks.findIndex((t) => t.id === overId);
                    if (activeIndex !== overIndex) {
                        return {
                            columns: state.columns.map((col) => {
                                if (col.id === activeColumn.id) {
                                    return { ...col, tasks: arrayMove(col.tasks, activeIndex, overIndex) };
                                }
                                return col;
                            })
                        };
                    }
                    return state;
                } else {
                    // Different column move
                    const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
                    const overIndex = overColumn.tasks.findIndex((t) => t.id === overId);

                    let newColumns = [...state.columns];
                    const sourceColIndex = newColumns.findIndex(c => c.id === activeColId);
                    const destColIndex = newColumns.findIndex(c => c.id === overColId);

                    const [movedTask] = newColumns[sourceColIndex].tasks.splice(activeIndex, 1);

                    if (overId === overColId) {
                        // Dropped on column header/empty space -> to end
                        newColumns[destColIndex].tasks.push(movedTask);
                    } else {
                        // Dropped on another task
                        // If overIndex is -1 (shouldn't happen here if logic is right), push to end
                        if (overIndex >= 0) {
                            newColumns[destColIndex].tasks.splice(overIndex, 0, movedTask);
                        } else {
                            newColumns[destColIndex].tasks.push(movedTask);
                        }
                    }

                    return { columns: newColumns };
                }
            }),
            setColumns: (columns) => set({ columns }),
        }),
        {
            name: 'hubview-storage-v1', // Versioned local storage key
        }
    )
);
