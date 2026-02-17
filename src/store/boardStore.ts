import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Card {
    id: string;
    content: string;
}

export interface Column {
    id: string;
    title: string;
    cardIds: string[];
}

export interface Project {
    id: string;
    title: string;
    description?: string;
    columnIds: string[];
}

interface BoardState {
    projects: Record<string, Project>;
    columns: Record<string, Column>;
    cards: Record<string, Card>;

    // Project Actions
    addProject: (title: string, description?: string) => void;
    deleteProject: (id: string) => void;

    // Column Actions
    addColumn: (projectId: string, title: string) => void;
    deleteColumn: (projectId: string, columnId: string) => void;

    // Card Actions
    addCard: (columnId: string, content: string) => void;
    deleteCard: (columnId: string, cardId: string) => void;

    // Reordering Actions (DnD)
    moveCard: (activeId: string, overId: string) => void;
    moveColumn: (projectId: string, activeId: string, overId: string) => void;
}

export const useBoardStore = create<BoardState>()(
    persist(
        (set) => ({
            projects: {},
            columns: {},
            cards: {},

            addProject: (title, description) => set((state) => {
                const id = uuidv4();
                return {
                    projects: {
                        ...state.projects,
                        [id]: { id, title, description, columnIds: [] }
                    }
                };
            }),

            deleteProject: (id) => set((state) => {
                const { [id]: deleted, ...rest } = state.projects;
                return { projects: rest };
            }),

            addColumn: (projectId, title) => set((state) => {
                const columnId = uuidv4();
                const project = state.projects[projectId];
                if (!project) return state;

                return {
                    columns: {
                        ...state.columns,
                        [columnId]: { id: columnId, title, cardIds: [] }
                    },
                    projects: {
                        ...state.projects,
                        [projectId]: {
                            ...project,
                            columnIds: [...project.columnIds, columnId]
                        }
                    }
                };
            }),

            deleteColumn: (projectId, columnId) => set((state) => {
                const project = state.projects[projectId];
                if (!project) return state;

                const { [columnId]: deletedCol, ...remainingCols } = state.columns;

                return {
                    columns: remainingCols,
                    projects: {
                        ...state.projects,
                        [projectId]: {
                            ...project,
                            columnIds: project.columnIds.filter(id => id !== columnId)
                        }
                    }
                };
            }),

            addCard: (columnId, content) => set((state) => {
                const cardId = uuidv4();
                const column = state.columns[columnId];
                if (!column) return state;

                return {
                    cards: {
                        ...state.cards,
                        [cardId]: { id: cardId, content }
                    },
                    columns: {
                        ...state.columns,
                        [columnId]: {
                            ...column,
                            cardIds: [...column.cardIds, cardId]
                        }
                    }
                };
            }),

            deleteCard: (columnId, cardId) => set((state) => {
                const column = state.columns[columnId];
                if (!column) return state;

                const { [cardId]: deletedCard, ...remainingCards } = state.cards;

                return {
                    cards: remainingCards,
                    columns: {
                        ...state.columns,
                        [columnId]: {
                            ...column,
                            cardIds: column.cardIds.filter(id => id !== cardId)
                        }
                    }
                }
            }),

            moveCard: (activeId, overId) => set((state) => {
                const activeCard = state.cards[activeId];
                const overCard = state.cards[overId];
                const overColumn = state.columns[overId]; // Case where we drag over an empty column

                // Find source column
                const sourceColumnId = Object.keys(state.columns).find(
                    colId => state.columns[colId].cardIds.includes(activeId)
                );

                if (!sourceColumnId) return state;

                // Destination Column ID
                let destColumnId = overCard
                    ? Object.keys(state.columns).find(colId => state.columns[colId].cardIds.includes(overId))
                    : overColumn?.id;

                if (!destColumnId) return state;

                const sourceColumn = state.columns[sourceColumnId];
                const destColumn = state.columns[destColumnId];

                // Moving within the same column
                if (sourceColumnId === destColumnId) {
                    const oldIndex = sourceColumn.cardIds.indexOf(activeId);
                    const newIndex = sourceColumn.cardIds.indexOf(overId);

                    if (oldIndex === newIndex) return state;

                    const newCardIds = [...sourceColumn.cardIds];
                    newCardIds.splice(oldIndex, 1);
                    newCardIds.splice(newIndex, 0, activeId);

                    return {
                        columns: {
                            ...state.columns,
                            [sourceColumnId]: {
                                ...sourceColumn,
                                cardIds: newCardIds
                            }
                        }
                    };
                }

                // Moving to a different column
                // Remove from source
                const newSourceCardIds = sourceColumn.cardIds.filter(id => id !== activeId);

                // Add to destination
                const newDestCardIds = [...destColumn.cardIds];
                const newIndex = overCard ? destColumn.cardIds.indexOf(overId) : newDestCardIds.length;

                newDestCardIds.splice(newIndex >= 0 ? newIndex : newDestCardIds.length, 0, activeId);

                return {
                    columns: {
                        ...state.columns,
                        [sourceColumnId]: {
                            ...sourceColumn,
                            cardIds: newSourceCardIds
                        },
                        [destColumnId]: {
                            ...destColumn,
                            cardIds: newDestCardIds
                        }
                    }
                };
            }),

            moveColumn: (projectId, activeId, overId) => set((state) => {
                const project = state.projects[projectId];
                if (!project) return state;

                const oldIndex = project.columnIds.indexOf(activeId);
                const newIndex = project.columnIds.indexOf(overId);

                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state;

                const newColumnIds = [...project.columnIds];
                newColumnIds.splice(oldIndex, 1);
                newColumnIds.splice(newIndex, 0, activeId);

                return {
                    projects: {
                        ...state.projects,
                        [projectId]: {
                            ...project,
                            columnIds: newColumnIds
                        }
                    }
                };
            })

        }),
        {
            name: 'board-storage',
        }
    )
);
