import { create } from 'zustand';

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
    syncStatus?: 'syncing' | 'synced' | 'error';
    position?: number; // Para ordenação
};

export type Column = {
    id: string;
    title: string;
    tasks: Task[];
    color?: string;
    isDone?: boolean;
    syncStatus?: 'syncing' | 'synced' | 'error';
    position?: number; // Para ordenação
};

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

export type TaskCounts = Record<string, { total: number; byColumn: Record<string, number>; byPriority: Record<string, number> }>;

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    taskCounts: TaskCounts;

    // Project Actions
    fetchProjects: () => Promise<void>;
    fetchTaskCounts: () => Promise<void>;
    addProject: (title: string, description?: string) => Promise<string>;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateProjectAPI: (id: string, updates: Partial<Project>) => Promise<void>;
    inactivateProject: (id: string) => Promise<void>;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Fetch Board Data (Columns & Tasks)
    fetchBoardData: (projectId: string) => Promise<void>;
    isLoadingProjects: boolean;
    isLoadingBoard: boolean;

    // Kanban Actions (scoped to active project)
    addColumn: () => Promise<void>;
    deleteColumn: (id: string) => Promise<void>;
    updateColumnTitle: (id: string, title: string) => Promise<void>;
    updateColumnColor: (id: string, color: string) => Promise<void>;
    toggleColumnDone: (id: string) => Promise<void>;
    addTask: (columnId: string, task: Omit<Task, 'id'>) => Promise<string>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    moveColumn: (activeId: string, overId: string) => Promise<void>;
    moveTask: (activeId: string, overId: string, activeColId: string | null, overColId: string | null) => Promise<void>;

    // Import/Export (scoped to active project)
    setColumns: (columns: Column[]) => void;
}

const defaultColumnsTemplate: Column[] = [
    {
        id: 'backlog',
        title: 'BACKLOG',
        tasks: [],
        color: '#ef4444',
        syncStatus: 'synced'
    },
    {
        id: 'in-progress',
        title: 'EM PROGRESSO',
        tasks: [],
        color: '#eab308',
        syncStatus: 'synced'
    },
    {
        id: 'review',
        title: 'CODE REVIEW',
        tasks: [],
        color: '#8b5cf6',
        syncStatus: 'synced'
    },
    {
        id: 'done',
        title: 'CONCLUÍDO',
        tasks: [],
        color: '#10b981',
        syncStatus: 'synced'
    },
];

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    activeProjectId: null,
    taskCounts: {},
    isLoadingProjects: false,
    isLoadingBoard: false,

    fetchProjects: async () => {
        set({ isLoadingProjects: true });
        try {
            const response = await fetch('/api/projects/fetch', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to fetch projects');

            const data = await response.json();

            const parseColumns = (raw: unknown): Column[] => {
                if (!raw || raw === 'undefined' || raw === 'null') {
                    return JSON.parse(JSON.stringify(defaultColumnsTemplate));
                }
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const columns = Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(defaultColumnsTemplate));

                    // Map 'completed' (Sim/Não) to isDone (boolean)
                    return columns.map((c: any) => ({
                        ...c,
                        isDone: c.isDone || c.completed === 'Sim'
                    }));
                } catch {
                    return JSON.parse(JSON.stringify(defaultColumnsTemplate));
                }
            };

            const loadedProjects: Project[] = (data as any[]).map((p: any) => ({
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

            // Fetch task counts in parallel
            get().fetchTaskCounts();

        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            set({ isLoadingProjects: false });
        }
    },

    fetchTaskCounts: async () => {
        try {
            const response = await fetch('/api/tasks/count', { method: 'POST' });
            if (!response.ok) return;
            const counts = await response.json();
            if (counts && !counts.error) {
                set({ taskCounts: counts });
            }
        } catch (error) {
            console.error('Error fetching task counts:', error);
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

    // --- Fetch Board Data ---
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // --- Fetch Board Data ---
    fetchBoardData: async (projectId) => {
        if (!projectId) return;
        set({ isLoadingBoard: true });

        try {
            // 1. Fetch Columns
            const colResponse = await fetch('/api/columns/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const dbColumns = await colResponse.json();

            // 2. Fetch Tasks
            const taskResponse = await fetch('/api/tasks/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const dbTasks = await taskResponse.json();

            if (!Array.isArray(dbColumns) || !Array.isArray(dbTasks)) {
                console.error('Dados inválidos retornados da API', { dbColumns, dbTasks });
                return;
            }

            // 3. Map to Store Structure
            const newColumns: Column[] = (dbColumns as { id: string, title: string, color: string, position: number, completed?: string }[]).map(c => ({
                id: c.id,
                title: c.title,
                color: c.color,
                position: c.position,
                isDone: c.completed === 'Sim',
                tasks: [],
                syncStatus: 'synced' as const
            })).sort((a, b) => (a.position || 0) - (b.position || 0));

            // Distribute Tasks to Columns
            (dbTasks as any[]).forEach((t) => {
                const column = newColumns.find(c => c.id === t.columnId); // columnId (CamelCase)
                if (column) {
                    column.tasks.push({
                        id: t.id,
                        content: t.content,
                        description: t.description,
                        priority: t.priority,
                        tags: t.tag ? [t.tag] : [], // Novo schema usa 'tag' string única
                        assignee: t.createdBy, // Mapeado de 'createdBy'
                        startDate: t.startDate, // (Se existir no futuro/transient)
                        endDate: t.endDate,     // (Se existir no futuro/transient)
                        checklist: [],          // Removido do schema SQL
                        position: t.position,
                        syncStatus: 'synced' as const
                    });
                }
            });

            // Sort Tasks
            newColumns.forEach(c => c.tasks.sort((a, b) => (a.position || 0) - (b.position || 0)));

            // 4. Update Store
            set(state => ({
                projects: state.projects.map(p =>
                    p.id === projectId ? { ...p, columns: newColumns } : p
                )
            }));

        } catch (error) {
            console.error('Erro ao carregar dados do board:', error);
        } finally {
            set({ isLoadingBoard: false });
        }
    },

    // --- Kanban Actions ---

    addColumn: async () => {
        const tempId = uuidv4();
        const activeProject = get().projects.find(p => p.id === get().activeProjectId);
        if (!activeProject) return;

        const newPosition = activeProject.columns.length;
        const colors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newColumn: Column = {
            id: tempId,
            title: 'NOVA ETAPA',
            tasks: [],
            color: randomColor,
            syncStatus: 'syncing',
            position: newPosition
        };

        // Optimistic Update
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return {
                        ...p,
                        columns: [...p.columns, newColumn],
                        updatedAt: Date.now()
                    };
                }
                return p;
            })
        }));

        try {
            const response = await fetch('/api/columns/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tempId, // Envia ID gerado para o n8n
                    projectId: activeProject.id,
                    title: newColumn.title,
                    color: newColumn.color,
                    position: newColumn.position
                })
            });

            if (!response.ok) throw new Error('Failed to create column');
            const result = await response.json();
            const realId = result.id || result[0]?.id;

            if (realId) {
                set((state) => ({
                    projects: state.projects.map(p => {
                        if (p.id === state.activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => c.id === tempId ? { ...c, id: realId, syncStatus: 'synced' } : c)
                            };
                        }
                        return p;
                    })
                }));
            }
        } catch (error) {
            console.error('Error creating column:', error);
            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => c.id === tempId ? { ...c, syncStatus: 'error' } : c)
                        };
                    }
                    return p;
                })
            }));
        }
    },

    deleteColumn: async (colId) => {
        const state = get();
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        if (!activeProject) return;

        // Optimistic Update
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return {
                        ...p,
                        columns: p.columns.filter(c => c.id !== colId),
                        updatedAt: Date.now()
                    };
                }
                return p;
            })
        }));

        try {
            const response = await fetch('/api/columns/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: colId })
            });

            if (!response.ok) throw new Error('Failed to delete column');
        } catch (error) {
            console.error('Error deleting column:', error);
            // Revert would be complex, maybe just show error toast or re-fetch
            get().fetchProjects(); // Simplest rollback
        }
    },

    updateColumnTitle: async (colId, title) => {
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return {
                        ...p,
                        columns: p.columns.map(c => c.id === colId ? { ...c, title, syncStatus: 'syncing' } : c),
                        updatedAt: Date.now()
                    };
                }
                return p;
            })
        }));

        try {
            const response = await fetch('/api/columns/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: colId, title })
            });

            if (!response.ok) throw new Error('Failed to update column');

            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => c.id === colId ? { ...c, syncStatus: 'synced' } : c)
                        };
                    }
                    return p;
                })
            }));
        } catch (error) {
            console.error('Error update column title:', error);
            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => c.id === colId ? { ...c, syncStatus: 'error' } : c)
                        };
                    }
                    return p;
                })
            }));
        }
    },

    updateColumnColor: async (colId, color) => {
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return {
                        ...p,
                        columns: p.columns.map(c => c.id === colId ? { ...c, color, syncStatus: 'syncing' } : c),
                        updatedAt: Date.now()
                    };
                }
                return p;
            })
        }));

        try {
            const response = await fetch('/api/columns/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: colId, color })
            });

            if (!response.ok) throw new Error('Failed to update column color');

            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => c.id === colId ? { ...c, syncStatus: 'synced' } : c)
                        };
                    }
                    return p;
                })
            }));
        } catch (error) {
            console.error('Error update column color:', error);
            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => c.id === colId ? { ...c, syncStatus: 'error' } : c)
                        };
                    }
                    return p;
                })
            }));
        }
    },

    toggleColumnDone: async (id) => {
        const activeProject = get().projects.find(p => p.id === get().activeProjectId);
        if (!activeProject) return;

        const column = activeProject.columns.find(c => c.id === id);
        if (!column) return;

        const newIsDone = !column.isDone;

        set(state => ({
            projects: state.projects.map(p => {
                if (p.id !== get().activeProjectId) return p;
                return {
                    ...p,
                    columns: p.columns.map(c => c.id === id ? { ...c, isDone: newIsDone, syncStatus: 'syncing' } : c)
                };
            })
        }));

        try {
            await fetch('/api/columns/completed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isDone: newIsDone })
            });

            set(state => ({
                projects: state.projects.map(p => {
                    if (p.id !== get().activeProjectId) return p;
                    return {
                        ...p,
                        columns: p.columns.map(c => c.id === id ? { ...c, syncStatus: 'synced' } : c)
                    };
                })
            }));

            // Refresh task counts because completion logic changed
            get().fetchTaskCounts();

        } catch (error) {
            console.error('Failed to update column isDone', error);
            // Revert
            set(state => ({
                projects: state.projects.map(p => {
                    if (p.id !== get().activeProjectId) return p;
                    return {
                        ...p,
                        columns: p.columns.map(c => c.id === id ? { ...c, isDone: !newIsDone, syncStatus: 'error' } : c)
                    };
                })
            }));
        }
    },

    addTask: async (colId, task) => {
        const newId = uuidv4();
        const activeProject = get().projects.find(p => p.id === get().activeProjectId);
        if (!activeProject) return newId;

        const column = activeProject.columns.find(c => c.id === colId);
        const newPosition = column ? column.tasks.length : 0;

        const newTask: Task = {
            ...task,
            id: newId,
            syncStatus: 'syncing',
            position: newPosition
        };

        set((state) => {
            return {
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => {
                                if (c.id === colId) {
                                    return { ...c, tasks: [...c.tasks, newTask] };
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

        try {
            const response = await fetch('/api/tasks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newId, // Envia ID gerado
                    columnId: colId,
                    content: task.content,
                    description: task.description,
                    priority: task.priority,
                    tag: (task.tags && task.tags[0]) ? task.tags[0].name : '', // Safe access
                    position: newPosition,
                    createdBy: 'Daniel_User'
                })
            });

            if (!response.ok) throw new Error('Failed to create task');
            const result = await response.json();
            const realId = result.id || result[0]?.id;

            if (realId) {
                set((state) => ({
                    projects: state.projects.map(p => {
                        if (p.id === state.activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({
                                    ...c,
                                    tasks: c.tasks.map(t => t.id === newId ? { ...t, id: realId, syncStatus: 'synced' } : t)
                                }))
                            };
                        }
                        return p;
                    })
                }));
                return realId;
            } else {
                throw new Error('No ID returned');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => ({
                                ...c,
                                tasks: c.tasks.map(t => t.id === newId ? { ...t, syncStatus: 'error' } : t)
                            }))
                        };
                    }
                    return p;
                })
            }));
            return newId;
        }

        return newId;
    },

    updateTask: async (taskId, updates) => {
        set((state) => {
            const { activeProjectId, projects } = state;
            if (!activeProjectId) return state;
            return {
                projects: projects.map(p => {
                    if (p.id === activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => ({
                                ...c,
                                tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updates, syncStatus: 'syncing' } : t)
                            })),
                            updatedAt: Date.now()
                        };
                    }
                    return p;
                })
            };
        });

        try {
            // Map updates to API expected format if needed
            const payload = { id: taskId, ...updates };
            // TODO: Handle tags mapping if updates contains tags

            const response = await fetch('/api/tasks/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update task');

            set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({
                                    ...c,
                                    tasks: c.tasks.map(t => t.id === taskId ? { ...t, syncStatus: 'synced' } : t)
                                }))
                            };
                        }
                        return p;
                    })
                };
            });
        } catch (error) {
            console.error('Error update task:', error);
            set((state) => {
                const { activeProjectId, projects } = state;
                if (!activeProjectId) return state;
                return {
                    projects: projects.map(p => {
                        if (p.id === activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({
                                    ...c,
                                    tasks: c.tasks.map(t => t.id === taskId ? { ...t, syncStatus: 'error' } : t)
                                }))
                            };
                        }
                        return p;
                    })
                };
            });
        }
    },

    deleteTask: async (taskId) => {
        // Optimistic
        set((state) => {
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
        });

        try {
            const response = await fetch('/api/tasks/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId })
            });

            if (!response.ok) throw new Error('Failed to delete task');
        } catch (error) {
            console.error('Error deleting task:', error);
            get().fetchProjects(); // Sync back
        }
    },

    moveColumn: async (activeId, overId) => {
        // Optimistic
        set((state) => {
            const { activeProjectId, projects } = state;
            if (!activeProjectId) return state;

            const project = projects.find(p => p.id === activeProjectId);
            if (!project) return state;

            const oldIndex = project.columns.findIndex(c => c.id === activeId);
            const newIndex = project.columns.findIndex(c => c.id === overId);
            const newColumns = arrayMove(project.columns, oldIndex, newIndex);

            // Update positions locally
            const updatedColumns = newColumns.map((col, index) => ({ ...col, position: index, syncStatus: 'syncing' as const }));

            return {
                projects: projects.map(p => {
                    if (p.id === activeProjectId) {
                        return {
                            ...p,
                            columns: updatedColumns,
                            updatedAt: Date.now()
                        };
                    }
                    return p;
                })
            };
        });

        // API Call for reorder
        // According to plan: "Enviar ID e nova position" for the moved column, but often dnd requires updating multiple positions.
        // The plan says: "Movimentação: Receber o taskId e a nova position/columnId e fazer o UPDATE".
        // For columns it might be similar.
        // Let's send the whole batch of changed columns or just the move info.
        // Assuming simple update for now: Send update for each column that changed position? Or a reorder endpoint?
        // Reuse Update Column endpoint for now updating position.

        try {
            const state = get();
            const project = state.projects.find(p => p.id === state.activeProjectId);
            if (project) {
                // Send updates for all columns to ensure consistency
                // Or simplified: Just update the one moved if the backend handles reorder? 
                // SQL is manual. Safe way: Update position of all columns in standard 'update' route.

                // Note: The plan for Columns Move says: "Receber o taskId e a nova position...". Wait, that's for tasks.
                // For Columns Move: "Movimentação: Receber o taskId e a nova position/columnId e fazer o UPDATE." (Wait, copy paste error in plan?)
                // Assuming we use the generic update column endpoint.

                const updates = project.columns.map(col =>
                    fetch('/api/columns/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: col.id, position: col.position })
                    })
                );

                await Promise.all(updates); // Parallel updates

                set((state) => ({
                    projects: state.projects.map(p => {
                        if (p.id === state.activeProjectId) {
                            return {
                                ...p,
                                columns: p.columns.map(c => ({ ...c, syncStatus: 'synced' as const }))
                            };
                        }
                        return p;
                    })
                }));
            }
        } catch (error) {
            console.error('Error moving column:', error);
            get().fetchProjects();
        }
    },

    moveTask: async (activeId, overId, activeColId, overColId) => {
        // Optimistic
        set((state) => {
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

            // Recalculate positions for ALL tasks in affected columns
            newColumns[activeColIndex].tasks.forEach((t, i) => { t.position = i; t.syncStatus = 'syncing'; });
            if (activeColId !== overColId) {
                newColumns[overColIndex].tasks.forEach((t, i) => { t.position = i; t.syncStatus = 'syncing'; });
            }

            const newProjects = [...state.projects];
            newProjects[projectIndex] = { ...project, columns: newColumns, updatedAt: Date.now() };

            return { projects: newProjects };
        });

        // API Sync
        try {
            // We need to send updates for all tasks that changed position or column.
            // Crucial: The task that moved column needs to send columnId update too.
            const state = get();
            const project = state.projects.find(p => p.id === state.activeProjectId);

            if (!project) return;

            // Gather all tasks from affected columns that need update
            const affectedTasks: { id: string; position: number; columnId: string }[] = [];
            const colsToCheck = [activeColId, overColId].filter((v, i, a) => v && a.indexOf(v) === i); // unique non-null codes

            colsToCheck.forEach(cId => {
                const col = project.columns.find(c => c.id === cId);
                if (col) {
                    col.tasks.forEach(t => {
                        // Ideally only send if dirty. For now sending all in col ensures integrity.
                        // Filter payload to minimize data: id, position, columnId
                        affectedTasks.push({
                            id: t.id,
                            position: t.position ?? 0,
                            columnId: cId || '', // Ensure columnId is correct
                        });
                    });
                }
            });

            // Batch update? Plan says: "O front-end envia uma lista de IDs e as suas novas posições. O n8n executa múltiplos UPDATE".
            // If the endpoint supports array, great. If not, standard loop.
            // Assuming the `update` route is per task based on standard REST.
            // Plan hint: "n8n: O front-end envia uma lista...". This implies a Batch endpoint or the update endpoint handles a list.
            // My created `api/tasks/update` proxies to `hubview-cards-altera`.
            // Let's assume `hubview-cards-altera` can handle a single object.
            // If the user plan says "Lista de IDs", maybe I should have made a batch route?
            // "n8n: O front-end envia uma lista de IDs e as suas novas posições. O n8n executa múltiplos UPDATE no MSSQL."
            // This suggests a BULK update.
            // I will implement parallel single updates for now as it's safer without validiting the batch capability of the webhook.
            // But to be cleaner, I'll send just the critical one first (the move) then the reorders.

            // Actually, `hubview-cards-altera` logic in n8n (Move) likely expects: id, columnId, position.

            const updates = affectedTasks.map(t =>
                fetch('/api/tasks/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(t)
                })
            );

            await Promise.all(updates);

            set((state) => ({
                projects: state.projects.map(p => {
                    if (p.id === state.activeProjectId) {
                        return {
                            ...p,
                            columns: p.columns.map(c => ({
                                ...c,
                                tasks: c.tasks.map(t => t.syncStatus === 'syncing' ? { ...t, syncStatus: 'synced' as const } : t)
                            }))
                        };
                    }
                    return p;
                })
            }));

        } catch (error) {
            console.error('Error moving task:', error);
            get().fetchProjects();
        }
    },

    setColumns: (columns) => set((state) => {
        const { activeProjectId, projects } = state;
        if (!activeProjectId) return state;
        return {
            projects: projects.map(p => p.id === activeProjectId ? { ...p, columns, updatedAt: Date.now() } : p)
        };
    }),
}));
