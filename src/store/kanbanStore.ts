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
    status?: string;
    columns: Column[];
    createdAt: number;
    updatedAt: number;
    syncStatus?: 'syncing' | 'synced' | 'error';
};

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;

    // Project Actions
    fetchProjects: () => Promise<void>;
    addProject: (title: string, description?: string) => Promise<string>;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateProjectAPI: (id: string, updates: Partial<Project>) => Promise<void>;
    inactivateProject: (id: string) => Promise<void>;
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

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    activeProjectId: null,

    fetchProjects: async () => {
        try {
            const response = await fetch('/api/projects/fetch', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to fetch projects');

            const data = await response.json();

            // Map API response to Project structure
            // Assuming API returns array of projects matching Project type or close to it
            // Adjust mapping based on actual API response structure if needed
            const parseColumns = (raw: any): Column[] => {
                if (!raw || raw === 'undefined' || raw === 'null') {
                    return JSON.parse(JSON.stringify(defaultColumnsTemplate));
                }
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(defaultColumnsTemplate));
                } catch {
                    return JSON.parse(JSON.stringify(defaultColumnsTemplate));
                }
            };

            const loadedProjects: Project[] = data.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.status || 'active',
                createdAt: new Date(p.createdAt).getTime(),
                updatedAt: new Date(p.updatedAt).getTime(),
                columns: parseColumns(p.columns),
                syncStatus: 'synced'
            }));

            set({ projects: loadedProjects });

            // Set active project if none selected and projects exist
            if (!get().activeProjectId && loadedProjects.length > 0) {
                set({ activeProjectId: loadedProjects[0].id });
            }

        } catch (error) {
            console.error('Error fetching projects:', error);
            // Optionally set functionality to show error state in UI
        }
    },

    addProject: async (title, description) => {
        const tempId = uuidv4();
        const newProject: Project = {
            id: tempId,
            title,
            description,
            columns: JSON.parse(JSON.stringify(defaultColumnsTemplate)),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'syncing'
        };

        // Optimistic Update
        set((state) => ({ projects: [...state.projects, newProject], activeProjectId: tempId }));

        try {
            const response = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    createdBy: 'Daniel_Admin' // Hardcoded for now as per plan
                })
            });

            if (!response.ok) throw new Error('Failed to create project');

            const result = await response.json();
            const realId = result.id || result[0]?.id; // Adjust based on n8n response

            if (realId) {
                set((state) => ({
                    projects: state.projects.map(p =>
                        p.id === tempId ? { ...p, id: realId, syncStatus: 'synced' } : p
                    ),
                    activeProjectId: realId // Update active ID if it was the temp one
                }));
                return realId;
            } else {
                throw new Error('No ID returned from API');
            }

        } catch (error) {
            console.error('Error creating project:', error);
            set((state) => ({
                projects: state.projects.map(p =>
                    p.id === tempId ? { ...p, syncStatus: 'error' } : p
                )
            }));
            return tempId;
        }
    },

    updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
    })),

    updateProjectAPI: async (id, updates) => {
        // Optimistic update
        set((state) => ({
            projects: state.projects.map((p) =>
                p.id === id ? { ...p, ...updates, updatedAt: Date.now(), syncStatus: 'syncing' } : p
            )
        }));

        try {
            const response = await fetch('/api/projects/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });

            if (!response.ok) throw new Error('Falha ao atualizar projeto');

            set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === id ? { ...p, syncStatus: 'synced' } : p
                )
            }));
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === id ? { ...p, syncStatus: 'error' } : p
                )
            }));
            throw error;
        }
    },

    inactivateProject: async (id) => {
        // Optimistic: remove from list
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
        }));

        try {
            const response = await fetch('/api/projects/inactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!response.ok) throw new Error('Falha ao inativar projeto');
        } catch (error) {
            console.error('Erro ao inativar projeto:', error);
            // Re-fetch to restore state
            get().fetchProjects();
            throw error;
        }
    },

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
                    return {
                        ...p,
                        columns: arrayMove(p.columns, p.columns.findIndex(c => c.id === activeId), p.columns.findIndex(c => c.id === overId)),
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
}));
