import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '@/lib/api';
import { COLUMN_COLORS, DEFAULT_COLUMNS } from '@/lib/constants';

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

export type Activity = {
    id: string;
    taskId: string;
    userName: string;
    type: 'comment' | 'history';
    content: string;
    createdAt: string;
    userAvatar?: string;
};

export type Notification = {
    id: string;
    userId: string;
    activityId: string;
    projectId: string;
    isRead: boolean;
    createdAt: string;
    activityContent: string;
    activityType: string;
    activityUserName: string;
    activityUserAvatar?: string;
    taskId: string;
    projectName: string;
};

export type TaskCounts = Record<string, { total: number; byColumn: Record<string, number>; byPriority: Record<string, number> }>;

export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
};

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    taskCounts: TaskCounts;
    currentUser: User | null;

    // Initialization
    initializeUser: () => void;

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

    // Activities
    taskActivities: Record<string, Activity[]>;
    isLoadingActivities: boolean;
    fetchTaskActivities: (taskId: string) => Promise<void>;
    addTaskActivity: (taskId: string, type: 'comment' | 'history', content: string) => Promise<void>;

    // Notifications
    notifications: Notification[];
    unreadNotificationsCount: number;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;

    // View State
    activeView: 'kanban' | 'list' | 'calendar';
    setActiveView: (view: 'kanban' | 'list' | 'calendar') => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    activeProjectId: null,
    taskCounts: {},
    isLoadingProjects: false,
    isLoadingBoard: false,
    currentUser: null,
    activeView: 'kanban',
    taskActivities: {},
    isLoadingActivities: false,
    notifications: [],
    unreadNotificationsCount: 0,
    setActiveView: (view) => set({ activeView: view }),

    initializeUser: () => {
        if (typeof window === 'undefined') return;
        try {
            const storedUser = localStorage.getItem('hubview_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                set({ currentUser: user });
                // Also kick off notification polling here directly
                get().fetchNotifications();
                // We'll set an interval later
            }
        } catch (error) {
            console.error('Failed to parse user from localStorage', error);
        }
    },

    fetchNotifications: async () => {
        const { currentUser } = get();
        if (!currentUser?.id) return;
        try {
            const data = await api.post<{ success: boolean; notifications: Notification[] }>('/api/notifications/list', { userId: currentUser.id });
            if (data?.success && Array.isArray(data.notifications)) {
                set({
                    notifications: data.notifications,
                    unreadNotificationsCount: data.notifications.length
                });
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    },

    markNotificationAsRead: async (id: string) => {
        try {
            await api.post('/api/notifications/read', { notificationId: id });
            set((state) => {
                const updated = state.notifications.filter(n => n.id !== id);
                return { notifications: updated, unreadNotificationsCount: updated.length };
            });
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    },

    markAllNotificationsAsRead: async () => {
        const { currentUser } = get();
        if (!currentUser?.id) return;
        try {
            await api.post('/api/notifications/read-all', { userId: currentUser.id });
            set({ notifications: [], unreadNotificationsCount: 0 });
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    },

    fetchProjects: async () => {
        set({ isLoadingProjects: true });
        try {
            const data = await api.post<any[]>('/api/projects/fetch', {});

            const parseColumns = (raw: unknown): Column[] => {
                if (!raw || raw === 'undefined' || raw === 'null') {
                    return JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
                }
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const columns = Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(DEFAULT_COLUMNS));

                    // Map 'completed' (Sim/Não) to isDone (boolean)
                    return columns.map((c: any) => ({
                        ...c,
                        isDone: c.isDone || c.completed === 'Sim'
                    }));
                } catch {
                    return JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
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
            const counts = await api.post<TaskCounts>('/api/tasks/count', {});
            if (counts && !(counts as any).error) {
                set({ taskCounts: counts });
            }
        } catch (error) {
            console.error('Error fetching task counts:', error);
        }
    },

    addProject: async (title, description) => {
        const tempId = uuidv4();
        const currentUser = get().currentUser;

        const newProject: Project = {
            id: tempId,
            title,
            description,
            columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'syncing'
        };

        // Optimistic Update
        set((state) => ({ projects: [...state.projects, newProject], activeProjectId: tempId }));

        try {
            const result = await api.post<any>('/api/projects/create', {
                title,
                description,
                createdBy: currentUser?.name || 'Unknown User'
            });

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
            await api.post('/api/projects/update', { id, ...updates });

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
            await api.post('/api/projects/inactivate', { id });
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
    fetchBoardData: async (projectId) => {
        if (!projectId) return;
        set({ isLoadingBoard: true });

        try {
            // Parallel fetch for columns and rules
            const [dbColumns, dbTasks] = await Promise.all([
                api.post<any[]>('/api/columns/list', { projectId }),
                api.post<any[]>('/api/tasks/list', { projectId })
            ]);

            if (!Array.isArray(dbColumns) || !Array.isArray(dbTasks)) {
                console.error('Dados inválidos retornados da API', { dbColumns, dbTasks });
                return;
            }

            // Map to Store Structure
            const newColumns: Column[] = dbColumns
                .filter(c => c.id && c.title) // Filter out invalid entries (e.g. from SQL left join)
                .map(c => ({
                    id: c.id,
                    title: c.title,
                    color: c.color,
                    position: c.position,
                    isDone: c.completed === 'Sim',
                    tasks: [],
                    syncStatus: 'synced' as const
                })).sort((a, b) => (a.position || 0) - (b.position || 0));

            // Distribute Tasks to Columns
            dbTasks.forEach((t) => {
                const column = newColumns.find(c => c.id === t.columnId); // columnId (CamelCase)
                if (column) {
                    column.tasks.push({
                        id: t.id,
                        content: t.content,
                        description: t.description,
                        priority: t.priority,
                        // Normalização de Tags: Backend retorna string única ou objeto? Assumindo string se for antigo, ou objeto
                        // Normalização de Tags: Tenta decodificar JSON se for string array, senão trata como string única
                        tags: (() => {
                            if (!t.tag) return [];
                            let raw = t.tag;

                            if (typeof raw === 'string') {
                                raw = raw.trim();
                                // Clean up obvious bad values
                                if (raw === '[]' || raw === 'undefined' || raw === 'null' || raw === '[undefined]' || raw === '""') return [];

                                if (raw.startsWith('[') && raw.endsWith(']')) {
                                    try {
                                        const parsed = JSON.parse(raw);
                                        if (Array.isArray(parsed)) {
                                            // Ensure each tag is valid and not "undefined" string
                                            return parsed.filter(pt => pt && pt.name && pt.name !== 'undefined');
                                        }
                                        return [];
                                    } catch {
                                        return [{ id: 'tag-' + t.id, name: raw, color: '#3b82f6' }];
                                    }
                                }
                                // Legacy simple string tag
                                return [{ id: 'tag-' + t.id, name: raw, color: '#3b82f6' }];
                            }
                            return Array.isArray(raw) ? raw : [raw];
                        })(),
                        assignee: t.createdBy,
                        startDate: t.startDate_planned || t.startDate || t.start_date, // Support new field, camelCase and snake_case
                        endDate: t.endDate_planned || t.endDate || t.end_date,       // Support new field, camelCase and snake_case
                        checklist: (() => {
                            if (!t.checklist) return [];
                            try { return typeof t.checklist === 'string' ? JSON.parse(t.checklist) : t.checklist; }
                            catch { return []; }
                        })(),
                        position: t.position,
                        syncStatus: 'synced' as const
                    });
                }
            });

            // Sort Tasks
            newColumns.forEach(c => c.tasks.sort((a, b) => (a.position || 0) - (b.position || 0)));

            // Update Store
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
        const randomColor = COLUMN_COLORS[Math.floor(Math.random() * COLUMN_COLORS.length)];

        const newColumn: Column = {
            id: tempId,
            title: 'NOVA ETAPA',
            tasks: [],
            color: randomColor,
            syncStatus: 'syncing',
            isDone: false,
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
            const result = await api.post<any>('/api/columns/create', {
                id: tempId, // Envia ID gerado para o n8n
                projectId: activeProject.id,
                title: newColumn.title,
                color: newColumn.color,
                position: newColumn.position
            });

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
            await api.post('/api/columns/delete', { id: colId });
        } catch (error) {
            console.error('Error deleting column:', error);
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
            await api.post('/api/columns/update', { id: colId, title });

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
            await api.post('/api/columns/update', { id: colId, color });

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
            await api.post('/api/columns/completed', { id, isDone: newIsDone });

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
        const state = get();
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        if (!activeProject) return newId;

        const column = activeProject.columns.find(c => c.id === colId);
        const newPosition = column ? column.tasks.length : 0;
        const currentUser = state.currentUser;

        // Use provided assignee or fallback to current user
        const finalAssignee = task.assignee || currentUser?.name || 'Unassigned';

        const newTask: Task = {
            ...task,
            id: newId,
            syncStatus: 'syncing',
            position: newPosition,
            assignee: finalAssignee
        };

        set((state) => ({
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
        }));

        const cleanedTags = (task.tags || []).filter(t => t && t.name && t.name.trim() !== '' && t.name !== 'undefined');
        console.log('[DEBUG] addTask payload:', { ...task, tags: cleanedTags });

        try {
            const result = await api.post<any>('/api/tasks/create', {
                id: newId, // Envia ID gerado
                columnId: colId,
                content: task.content,
                description: task.description,
                priority: task.priority,
                tag: (cleanedTags && cleanedTags[0]) ? cleanedTags[0].name : '', // Legacy support
                tags: cleanedTags, // Full array for modern n8n workflows
                position: newPosition,
                createdBy: currentUser?.name || 'Unknown',
                assignee: finalAssignee,
                startDate: task.startDate,
                endDate: task.endDate,
                startDate_planned: task.startDate, // Send to new field
                endDate_planned: task.endDate      // Send to new field
            });

            const realId = result.id || result[0]?.id;

            if (realId) {
                // Trigger checklist save if new task contains checklist
                if (task.checklist && task.checklist?.length > 0) {
                    api.post('/api/tasks/checklist/save', {
                        taskId: realId,
                        checklist: task.checklist
                    }).catch(err => console.error('Error saving checklist on task creation:', err));
                }

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
    },

    updateTask: async (taskId, updates) => {
        const state = get();
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        if (!activeProject) return;

        let oldTask: Task | null = null;
        for (const col of activeProject.columns) {
            const task = col.tasks.find(t => t.id === taskId);
            if (task) {
                oldTask = task;
                break;
            }
        }

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
            const cleanedTags = updates.tags ? updates.tags.filter(t => t && t.name && t.name.trim() !== '' && t.name !== 'undefined') : undefined;
            const updatesToLog = { ...updates };
            if (cleanedTags !== undefined) updatesToLog.tags = cleanedTags;
            console.log('[DEBUG] updateTask payload:', { id: taskId, ...updatesToLog });

            const payload = {
                id: taskId,
                ...updates,
                // Ensure tags are sent correctly as array, even if empty
                ...(updates.hasOwnProperty('tags') ? { tags: cleanedTags || [] } : {}),
                // If updating start/end date, also send to _planned fields
                ...(updates.startDate ? { startDate_planned: updates.startDate } : {}),
                ...(updates.endDate ? { endDate_planned: updates.endDate } : {})
            };

            // Delete checklist from update payload if it exists so n8n update node doesn't fail
            if ('checklist' in payload) {
                delete payload.checklist;
            }

            await api.post('/api/tasks/update', payload);

            // Trigger checklist save in parallel if it was updated
            if (updates.checklist) {
                api.post('/api/tasks/checklist/save', {
                    taskId,
                    checklist: updates.checklist
                }).catch(err => console.error('Error syncing checklist:', err));
            }

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

            // Log Automated Activities
            if (oldTask && updates.priority && updates.priority !== oldTask.priority) {
                const priorityMap = { low: 'Baixa', medium: 'Média', high: 'Alta' };
                const oldP = priorityMap[oldTask.priority] || oldTask.priority;
                const newP = priorityMap[updates.priority as 'low' | 'medium' | 'high'] || updates.priority;
                get().addTaskActivity(taskId, 'history', `Alterou a prioridade de ${oldP} para ${newP}`);
            }
            if (oldTask && updates.assignee && updates.assignee !== oldTask.assignee) {
                get().addTaskActivity(taskId, 'history', `Alterou o responsável de ${oldTask.assignee || 'Ninguém'} para ${updates.assignee}`);
            }
        } catch (error) {
            console.error('Error updating task:', error);
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
            await api.post('/api/tasks/delete', { id: taskId });
        } catch (error) {
            console.error('Error deleting task:', error);
            get().fetchBoardData(get().activeProjectId!);
        }
    },

    moveColumn: async (activeId, overId) => {
        const state = get();
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        if (!activeProject) return;

        const oldIndex = activeProject.columns.findIndex(c => c.id === activeId);
        const newIndex = activeProject.columns.findIndex(c => c.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newColumns = arrayMove(activeProject.columns, oldIndex, newIndex).map((col, index) => ({
            ...col,
            position: index
        }));

        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return { ...p, columns: newColumns, updatedAt: Date.now() };
                }
                return p;
            })
        }));

        try {
            // Sequential updates to ensure order
            for (const col of newColumns) {
                await api.post('/api/columns/update', { id: col.id, position: col.position });
            }
        } catch (error) {
            console.error('Error moving column:', error);
            get().fetchBoardData(state.activeProjectId!);
        }
    },

    moveTask: async (activeId, overId, activeColId, overColId) => {
        const state = get();
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        if (!activeProject || !activeColId || !overColId) return;

        // Clone current state for optimistic update
        const sourceColIndex = activeProject.columns.findIndex(c => c.id === activeColId);
        const destColIndex = activeProject.columns.findIndex(c => c.id === overColId);

        if (sourceColIndex === -1 || destColIndex === -1) return;

        const newColumns = [...activeProject.columns];
        const sourceCol = { ...newColumns[sourceColIndex], tasks: [...newColumns[sourceColIndex].tasks] };
        const destCol = activeColId === overColId
            ? sourceCol
            : { ...newColumns[destColIndex], tasks: [...newColumns[destColIndex].tasks] };

        const activeTaskIndex = sourceCol.tasks.findIndex(t => t.id === activeId);
        const activeTask = sourceCol.tasks[activeTaskIndex];

        if (!activeTask) return;

        // Perform move locally
        if (activeColId === overColId) {
            // Same column reorder
            const overTaskIndex = sourceCol.tasks.findIndex(t => t.id === overId);
            sourceCol.tasks = arrayMove(sourceCol.tasks, activeTaskIndex, overTaskIndex);

            // Re-assign positions
            sourceCol.tasks = sourceCol.tasks.map((t, i) => ({ ...t, position: i }));
            newColumns[sourceColIndex] = sourceCol;
        } else {
            // Different column
            sourceCol.tasks.splice(activeTaskIndex, 1);

            const overTaskIndex = overId
                ? destCol.tasks.findIndex(t => t.id === overId)
                : destCol.tasks.length;

            const newIndex = overTaskIndex >= 0 ? overTaskIndex : destCol.tasks.length;

            // Insert into new column
            destCol.tasks.splice(newIndex, 0, { ...activeTask, position: newIndex });

            // Re-assign positions for both columns
            sourceCol.tasks = sourceCol.tasks.map((t, i) => ({ ...t, position: i }));
            destCol.tasks = destCol.tasks.map((t, i) => ({ ...t, position: i }));

            newColumns[sourceColIndex] = sourceCol;
            newColumns[destColIndex] = destCol;
        }

        // Apply optimistic update
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return { ...p, columns: newColumns, updatedAt: Date.now() };
                }
                return p;
            })
        }));

        // Sequential Sync Logic
        try {
            const updatesToSync: Promise<any>[] = [];

            // If moved to different column, update the task's columnId immediately
            if (activeColId !== overColId) {
                await api.post('/api/tasks/update', { id: activeId, columnId: overColId });
                get().addTaskActivity(activeId, 'history', `Moveu a tarefa para a etapa ${destCol.title}`);
            }

            // Prepare batch of position updates
            const affectedTasks = activeColId === overColId
                ? sourceCol.tasks
                : [...sourceCol.tasks, ...destCol.tasks];

            // We use simple sequential await here to guarantee consistency, 
            // as Promise.all can be flaky if the DB locks rows
            for (const task of affectedTasks) {
                await api.post('/api/tasks/update', { id: task.id, position: task.position });
            }

        } catch (error) {
            console.error('Error moving task:', error);
            // Rollback is hard, simpler to just refetch the board state to sync with server
            get().fetchBoardData(state.activeProjectId!);
        }
    },

    setColumns: (columns) => {
        set((state) => ({
            projects: state.projects.map(p => {
                if (p.id === state.activeProjectId) {
                    return { ...p, columns, updatedAt: Date.now() };
                }
                return p;
            })
        }));
    },

    fetchTaskActivities: async (taskId) => {
        set({ isLoadingActivities: true });
        try {
            const data = await api.post<Activity[]>('/api/tasks/activities/list', { taskId });
            if (Array.isArray(data)) {
                set((state) => ({
                    taskActivities: {
                        ...state.taskActivities,
                        [taskId]: data
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            set({ isLoadingActivities: false });
        }
    },

    addTaskActivity: async (taskId, type, content) => {
        let currentUser = get().currentUser?.name;
        let userAvatar = get().currentUser?.avatar;
        if (!currentUser && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('hubview_user');
                if (stored) {
                    const user = JSON.parse(stored);
                    currentUser = user.name;
                    userAvatar = user.avatar;
                    get().initializeUser();
                }
            } catch { /* ignore */ }
        }
        currentUser = currentUser || 'Sistema';

        const tempActivity: Activity = {
            id: uuidv4(),
            taskId,
            userName: currentUser,
            userAvatar: userAvatar || undefined,
            type,
            content,
            createdAt: new Date().toISOString()
        };

        set((state) => ({
            taskActivities: {
                ...state.taskActivities,
                [taskId]: [...(state.taskActivities[taskId] || []), tempActivity]
            }
        }));

        try {
            await api.post('/api/tasks/activities/create', {
                taskId,
                userName: currentUser,
                userAvatar: userAvatar || '',
                type,
                content
            });
        } catch (error) {
            console.error('Failed to save activity:', error);
        }
    }
}));
