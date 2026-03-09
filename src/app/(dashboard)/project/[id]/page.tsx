"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Dropdown, MenuProps, Typography, Skeleton } from 'antd';
import { ArrowLeft, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import BoardColumn from '@/components/board/BoardColumn';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, DragEndEvent, DragOverEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useHydrated } from '@/hooks/useHydrated';

const { Title } = Typography;

export default function ProjectBoard() {
    const mounted = useHydrated();
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const projects = useBoardStore((state) => state.projects);
    const columns = useBoardStore((state) => state.columns);
    const addColumn = useBoardStore((state) => state.addColumn);
    const deleteProject = useBoardStore((state) => state.deleteProject);
    const moveCard = useBoardStore((state) => state.moveCard);
    const moveColumn = useBoardStore((state) => state.moveColumn);

    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const project = projects[projectId];

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // Wait 10px movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(TouchSensor)
    );

    if (!mounted) return <div className="p-8"><Skeleton active /></div>;
    if (!project) return <div className="p-8 text-center">Projeto não encontrado.</div>;

    const handleAddColumn = () => {
        if (!newColumnTitle.trim()) {
            setIsAddingColumn(false);
            return;
        }
        addColumn(projectId, newColumnTitle);
        setNewColumnTitle('');
        setIsAddingColumn(false);
    };

    const handleDeleteProject = () => {
        deleteProject(projectId);
        router.push('/');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'delete',
            label: 'Excluir Projeto',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: handleDeleteProject
        }
    ];

    // DnD Handlers (Placeholders for now, will implement logic in next phase/steps or if inline)
    // For now, enable visual drag but logic needs store support for strict arrayMove.
    // We need to implement proper onDragEnd updating the store.

    function handleDragStart() { }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveACard = active.data.current?.type === 'Card';
        const isOverACard = over.data.current?.type === 'Card';
        if (!isActiveACard) return;

        // Dropping a Card over another Card
        if (isActiveACard && isOverACard) {
            // Logic handled in DragEnd for reordering, but visual updates can happen here if using local state.
            // Since we use global store for simplicity, we rely on DragEnd or we could trigger moveCard here for real-time visual.
            // Real-time visual is better:
            // But triggering store updates on DragOver can be expensive and jittery without optimistic UI.
            // We will stick to DragEnd for simplicity as per plan, 
            // EXCEPT dnd-kit recommends DragOver for inter-container sorting to make it possible to drop into empty containers or different containers.

            // Check if they are in different columns to trigger inter-column movement immediately implies better UX
            // But let's start with DragEnd for stability.
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) {
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        const isActiveAColumn = active.data.current?.type === 'Column';
        const isActiveACard = active.data.current?.type === 'Card';

        if (isActiveAColumn) {
            moveColumn(projectId, activeId, overId);
        } else if (isActiveACard) {
            moveCard(activeId, overId);
        }

    }



    return (
        <main className="relative flex h-screen flex-col overflow-hidden bg-[var(--background)]">
            <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.05]" />

            {/* Navbar */}
            <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-[var(--header-border)] bg-[var(--header)] px-6 text-[var(--foreground)] backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Button
                        type="text"
                        icon={<ArrowLeft size={18} className="text-[var(--foreground)]" />}
                        className="!text-[var(--foreground)] hover:!text-[var(--primary)]"
                        onClick={() => router.push('/')}
                    />
                    <Title level={4} style={{ margin: 0, color: 'var(--foreground)' }}>{project.title}</Title>
                </div>
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <Button type="text" icon={<MoreVertical size={18} className="text-[var(--foreground)]" />} className="!text-[var(--foreground)] hover:!text-[var(--primary)]" />
                </Dropdown>
            </header>

            {/* Board Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="h-full flex p-4 items-start">
                        <SortableContext items={project.columnIds} strategy={horizontalListSortingStrategy}>
                            {project.columnIds.map((colId) => {
                                const col = columns[colId];
                                // If column deleted but still in project ref (edge case), skip
                                if (!col) return null;
                                return (
                                    <BoardColumn
                                        key={colId}
                                        id={colId}
                                        title={col.title}
                                        cardIds={col.cardIds}
                                        projectId={projectId}
                                    />
                                );
                            })}
                        </SortableContext>

                        {/* Add Column Button */}
                        <div className="w-80 flex-shrink-0 ml-2">
                            {!isAddingColumn ? (
                                <button
                                    className="group h-auto flex w-full items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
                                    onClick={() => setIsAddingColumn(true)}
                                >
                                    <div className="rounded-lg bg-[var(--column-bg)] p-2 transition-colors group-hover:bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] group-hover:text-[var(--primary)]">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-semibold text-lg">Adicionar outra lista</span>
                                </button>
                            ) : (
                                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--sidebar)] p-3 shadow-[var(--surface-shadow-soft)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                    <Input
                                        autoFocus
                                        placeholder="Título da lista..."
                                        className="mb-3 h-10 rounded-lg !border-[var(--input-border)] !bg-[var(--input-bg)] !text-[var(--foreground)] placeholder:!text-[var(--muted-foreground)] focus:!border-[var(--primary)] focus:!shadow-none"
                                        value={newColumnTitle}
                                        onChange={(e) => setNewColumnTitle(e.target.value)}
                                        onPressEnter={handleAddColumn}
                                        maxLength={50}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button type="primary" onClick={handleAddColumn} className="!border-none !bg-[var(--primary)] !text-[var(--primary-foreground)] shadow-lg shadow-[rgba(132,204,22,0.18)] hover:!bg-[var(--primary-hover)]">Adicionar lista</Button>
                                        <Button type="text" size="small" onClick={() => setIsAddingColumn(false)} className="!text-[var(--muted-foreground)] hover:!text-[var(--foreground)]">X</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Drag Overlay for smooth visuals */}
                <DragOverlay>
                    {/* If needed, render active item clone here */}
                </DragOverlay>
            </DndContext>
        </main>
    );
}
