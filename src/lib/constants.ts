export const COLUMN_COLORS = [
    '#ef4444', // Red
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
];

export const DEFAULT_COLUMNS = [
    {
        id: 'backlog',
        title: 'BACKLOG',
        tasks: [],
        color: '#ef4444',
        syncStatus: 'synced',
        isDone: false
    },
    {
        id: 'in-progress',
        title: 'EM PROGRESSO',
        tasks: [],
        color: '#eab308',
        syncStatus: 'synced',
        isDone: false
    },
    {
        id: 'review',
        title: 'CODE REVIEW',
        tasks: [],
        color: '#8b5cf6',
        syncStatus: 'synced',
        isDone: false
    },
    {
        id: 'done',
        title: 'CONCLUÍDO',
        tasks: [],
        color: '#10b981',
        syncStatus: 'synced',
        isDone: true
    },
];
