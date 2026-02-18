import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';

export type Tag = {
    id: string;
    name: string;
    color: string;
};

export type Task = {
    id: string;
    content: string;
    description?: string;
    tags: Tag[];
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
    startDate?: string;
    endDate?: string;
    checklist?: { id: string; text: string; completed: boolean; }[];
};

export type Column = { id: string; title: string; tasks: Task[]; color?: string; };

export type Project = {
    id: string;
    title: string;
    description?: string;
    columns: Column[];
    createdAt: number;
    updatedAt: number;
};

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;

    // Project Actions
    addProject: (title: string, description?: string) => string;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Kanban Actions (scoped to active project)
    addColumn: () => void;
    deleteColumn: (id: string) => void;
    updateColumnTitle: (id: string, title: string) => void;
    updateColumnColor: (id: string, color: string) => void;
    addTask: (columnId: string, task: Omit<Task, 'id'>) => string;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveColumn: (activeId: string, overId: string) => void;
    moveTask: (activeId: string, overId: string, activeColId: string | null, overColId: string | null) => void;

    // Import/Export (scoped to active project)
    setColumns: (columns: Column[]) => void;
}

const defaultColumnsTemplate: Column[] = [
    {
        id: 'backlog',
        title: 'BACKLOG',
        tasks: [],
        color: '#ef4444',
    },
    {
        id: 'in-progress',
        title: 'EM PROGRESSO',
        tasks: [],
        color: '#eab308',
    },
    {
        id: 'review',
        title: 'CODE REVIEW',
        tasks: [],
        color: '#8b5cf6',
    },
    {
        id: 'done',
        title: 'CONCLUÍDO',
        tasks: [],
        color: '#10b981',
    },
];

const initialProject: Project = {
    id: 'default-project',
    title: 'Projeto Principal',
    description: 'Gestão Geral do Hub',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    columns: [
        {
            id: 'backlog',
            title: 'BACKLOG',
            tasks: [
                {
                    id: uuidv4(),
                    content: 'Implementar Autenticação',
                    description: 'Usar NextAuth com Google Provider',
                    tags: [{ id: 't1', name: 'Backend', color: '#ef4444' }],
                    priority: 'high',
                    startDate: '2023-11-01',
                    endDate: '2023-11-15'
                },
                {
                    id: uuidv4(),
                    content: 'Auditoria de Design',
                    tags: [{ id: 't2', name: 'Design', color: '#a855f7' }],
                    priority: 'medium'
                },
            ],
        },
        {
            id: 'in-progress',
            title: 'EM PROGRESSO',
            tasks: [
                {
                    id: uuidv4(),
                    content: 'Dashboard Analytics',
                    tags: [{ id: 't3', name: 'Frontend', color: '#3b82f6' }],
                    priority: 'high'
                },
            ],
        },
        {
            id: 'review',
            title: 'CODE REVIEW',
            tasks: [],
        },
        {
            id: 'done',
            title: 'CONCLUÍDO',
            tasks: [
                {
                    id: uuidv4(),
                    content: 'Setup Inicial',
                    tags: [{ id: 't4', name: 'DevOps', color: '#10b981' }],
                    priority: 'low'
                },
            ],
        },
    ]
};

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [initialProject],
            activeProjectId: 'default-project',

            addProject: (title, description) => {
                const newId = uuidv4();
                const newProject: Project = {
                    id: newId,
                    title,
                    description,
                    columns: JSON.parse(JSON.stringify(defaultColumnsTemplate)),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                set((state) => ({ projects: [...state.projects, newProject], activeProjectId: newId }));
                return newId;
            },

            updateProject: (id, updates) => set((state) => ({
                projects: state.projects.map((p) => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
            })),

            deleteProject: (id) => set((state) => {
                const remaining = state.projects.filter(p => p.id !== id);
                return {
                    projects: remaining,
                    activeProjectId: state.activeProjectId === id ? (remaining[0]?.id || null) : state.activeProjectId
                };
            }),

            setActiveProject: (id) => set({ activeProjectId: id }),

            // --- Kanban Actions ---

            addColumn: () => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                const colors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: [...p.columns, { id: uuidv4(), title: 'NOVA ETAPA', tasks: [], color: randomColor }],
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            deleteColumn: (colId) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.filter(c => c.id !== colId),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            updateColumnTitle: (colId, title) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => c.id === colId ? { ...c, title } : c),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            updateColumnColor: (colId, color) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => c.id === colId ? { ...c, color } : c),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            addTask: (colId, task) => {
                const newId = uuidv4();
                set((state) => {
                    const { activeProjectId, projects } = state;
                    if (!activeProjectId) return state;
                    return {
                        projects: projects.map(p => {
                            if (p.id === activeProjectId) {
                                return {
                                    ...p,
                                    columns: p.columns.map(c => {
                                        if (c.id === colId) {
                                            return { ...c, tasks: [...c.tasks, { ...task, id: newId }] };
                                        }
                                        return c;
                                    }),
                                    updatedAt: Date.now()
                                };
                            }
                            return p;
                        })
                    };
                });
                return newId;
            },

            updateTask: (taskId, updates) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({
                                    ...c,
                                    tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
                                })),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            deleteTask: (taskId) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({
                                    ...c,
                                    tasks: c.tasks.filter(t => t.id !== taskId)
                                })),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            moveColumn: (activeId, overId) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            const activeIndex = p.columns.findIndex((col) => col.id === activeId);
                            const overIndex = p.columns.findIndex((col) => col.id === overId);
                            return {
                                ...p,
                                columns: arrayMove(p.columns, activeIndex, overIndex),
                                updatedAt: Date.now()
                            };
                        }
                        return p;
                    })
                };
            }),

            moveTask: (activeId, overId, activeColId, overColId) => set((state) => {
                const activeIdProj = state.activeProjectId;
                if (!activeIdProj) return state;

                const projectIndex = state.projects.findIndex(p => p.id === activeIdProj);
                if (projectIndex === -1) return state;

                const project = state.projects[projectIndex];

                // Deep clone columns to safely mutate tasks array
                const newColumns = project.columns.map(col => ({
                    ...col,
                    tasks: [...col.tasks]
                }));

                const activeColIndex = newColumns.findIndex(c => c.id === activeColId);
                const overColIndex = newColumns.findIndex(c => c.id === overColId);

                if (activeColIndex === -1 || overColIndex === -1) return state;

                const activeTaskIndex = newColumns[activeColIndex].tasks.findIndex(t => t.id === activeId);
                const overTaskIndex = newColumns[overColIndex].tasks.findIndex(t => t.id === overId);

                if (activeTaskIndex === -1) return state;

                if (activeColId === overColId) {
                    // Same column reorder
                    if (activeTaskIndex !== overTaskIndex && overTaskIndex !== -1) {
                        newColumns[activeColIndex].tasks = arrayMove(newColumns[activeColIndex].tasks, activeTaskIndex, overTaskIndex);
                    }
                } else {
                    // Different column move
                    const [movedTask] = newColumns[activeColIndex].tasks.splice(activeTaskIndex, 1);

                    if (overId === overColId) {
                        // Dropped in empty space of column
                        newColumns[overColIndex].tasks.push(movedTask);
                    } else {
                        // Dropped on another task
                        const targetIndex = overTaskIndex >= 0 ? overTaskIndex : newColumns[overColIndex].tasks.length;
                        newColumns[overColIndex].tasks.splice(targetIndex, 0, movedTask);
                    }
                }

                const newProjects = [...state.projects];
                newProjects[projectIndex] = { ...project, columns: newColumns, updatedAt: Date.now() };

                return { projects: newProjects };
            }),

            setColumns: (columns) => set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => p.id === activeProjectId ? { ...p, columns, updatedAt: Date.now() } : p)
                };
            }),
        }),
        {
            name: 'hubview-projects-v1', // V2/Project-based storage
        }
    )
);
