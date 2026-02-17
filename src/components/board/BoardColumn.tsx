import React, { useState } from 'react';
import { Card, Typography, Button, Dropdown, MenuProps, Input } from 'antd';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import BoardCard from './BoardCard';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BoardColumnProps {
    id: string;
    title: string;
    cardIds: string[];
    projectId: string;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ id, title, cardIds, projectId }) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardContent, setNewCardContent] = useState('');

    const deleteColumn = useBoardStore((state) => state.deleteColumn);
    const addCard = useBoardStore((state) => state.addCard);
    const cards = useBoardStore((state) => state.cards);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: id,
        data: {
            type: 'Column',
            column: { id, title }
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddCard = () => {
        if (!newCardContent.trim()) {
            setIsAddingCard(false);
            return;
        }
        addCard(id, newCardContent);
        setNewCardContent('');
        setIsAddingCard(false);
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'delete',
            label: 'Excluir Coluna',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: () => deleteColumn(projectId, id)
        }
    ];

    return (
        <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0 h-full max-h-full flex flex-col bg-[#112240]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl mr-6 transition-colors">
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-4 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-white/5 group/header"
            >
                <h3 className="text-gray-200 font-bold text-base truncate flex-1 tracking-wide">
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-black/20 px-2 py-0.5 rounded-full font-mono">{cardIds.length}</span>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <button type="button" className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={16} />
                        </button>
                    </Dropdown>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cardIds.map((cardId) => {
                        const card = cards[cardId];
                        if (!card) return null;
                        return <BoardCard key={cardId} id={cardId} content={card.content} columnId={id} />;
                    })}
                </SortableContext>
            </div>

            {/* Footer / Add Card */}
            <div className="p-3 pt-0">
                {isAddingCard ? (
                    <div className="bg-[#1e293b] p-3 rounded-xl shadow-lg border border-amber-500/30 animate-in fade-in zoom-in-95 duration-200">
                        <Input.TextArea
                            autoFocus
                            placeholder="Título do cartão..."
                            className="mb-3 !resize-none !bg-black/20 !border-white/10 !text-gray-200 placeholder:text-gray-600 focus:!border-amber-500/50 focus:!shadow-none"
                            value={newCardContent}
                            onChange={(e) => setNewCardContent(e.target.value)}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleAddCard();
                                }
                            }}
                            rows={3}
                        />
                        <div className="flex items-center gap-2 justify-end">
                            <Button type="text" size="small" onClick={() => setIsAddingCard(false)} className="text-gray-400 hover:text-white">Cancelar</Button>
                            <Button type="primary" size="small" onClick={handleAddCard} className="bg-amber-500 hover:bg-amber-400 text-black font-bold border-none shadow-amber-500/20 shadow-lg">Adicionar</Button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="w-full flex items-center justify-start gap-2 text-gray-400 hover:text-amber-400 hover:bg-white/5 p-2.5 rounded-lg transition-all duration-200 group/btn"
                        onClick={() => setIsAddingCard(true)}
                    >
                        <Plus size={18} className="text-gray-600 group-hover/btn:text-amber-400 transition-colors" />
                        <span className="font-medium">Adicionar cartão</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default BoardColumn;
