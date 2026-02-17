"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Dropdown, MenuProps, Typography, Skeleton } from 'antd';
import { ArrowLeft, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import BoardColumn from '@/components/board/BoardColumn';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, DragStartEvent, DragEndEvent, DragOverEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const { Title } = Typography;

export default function ProjectBoard() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const projects = useBoardStore((state) => state.projects);
    const columns = useBoardStore((state) => state.columns);
    const addColumn = useBoardStore((state) => state.addColumn);
    const deleteProject = useBoardStore((state) => state.deleteProject);
    const moveCard = useBoardStore((state) => state.moveCard);
    const moveColumn = useBoardStore((state) => state.moveColumn);

    const [mounted, setMounted] = useState(false);
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveACard = active.data.current?.type === 'Card';
        const isOverACard = over.data.current?.type === 'Card';
        const isOverAColumn = over.data.current?.type === 'Column';

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
            setActiveId(null);
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

        setActiveId(null);
    }



    return (
        <main className="h-screen flex flex-col bg-[#0a192f] overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* Navbar */}
            <header className="h-16 bg-[#112240]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 justify-between text-white shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        type="text"
                        icon={<ArrowLeft size={18} className="text-white" />}
                        onClick={() => router.push('/')}
                    />
                    <Title level={4} style={{ margin: 0, color: 'white' }}>{project.title}</Title>
                </div>
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <Button type="text" icon={<MoreVertical size={18} className="text-white" />} />
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
                                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200 group h-auto"
                                    onClick={() => setIsAddingColumn(true)}
                                >
                                    <div className="bg-white/10 p-2 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-semibold text-lg">Adicionar outra lista</span>
                                </button>
                            ) : (
                                <div className="bg-[#112240]/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                    <Input
                                        autoFocus
                                        placeholder="Título da lista..."
                                        className="mb-3 !bg-black/20 !border-white/10 !text-white placeholder:text-gray-500 focus:!border-amber-500/50 focus:!shadow-none h-10 rounded-lg"
                                        value={newColumnTitle}
                                        onChange={(e) => setNewColumnTitle(e.target.value)}
                                        onPressEnter={handleAddColumn}
                                        maxLength={50}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button type="primary" onClick={handleAddColumn} className="bg-amber-500 hover:bg-amber-400 text-black font-bold border-none shadow-amber-500/20 shadow-lg">Adicionar lista</Button>
                                        <Button type="text" size="small" onClick={() => setIsAddingColumn(false)} className="text-gray-400 hover:text-white">X</Button>
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
