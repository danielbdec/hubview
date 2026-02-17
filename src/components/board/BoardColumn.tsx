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
        <div ref={setNodeRef} style={style} className="w-72 flex-shrink-0 h-full max-h-full flex flex-col bg-gray-100 rounded-xl border border-gray-200 shadow-sm mr-4">
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-3 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-gray-200/50"
            >
                <Typography.Text strong className="text-gray-700 truncate flex-1">
                    {title}
                </Typography.Text>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>{cardIds.length}</span>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button type="text" size="small" icon={<MoreHorizontal size={16} />} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cardIds.map((cardId) => {
                        const card = cards[cardId];
                        if (!card) return null;
                        return <BoardCard key={cardId} id={cardId} content={card.content} columnId={id} />;
                    })}
                </SortableContext>
            </div>

            {/* Footer / Add Card */}
            <div className="p-2">
                {isAddingCard ? (
                    <div className="bg-white p-2 rounded shadow-sm border border-blue-200">
                        <Input.TextArea
                            autoFocus
                            placeholder="Titulo do cartão..."
                            className="mb-2 !resize-none"
                            value={newCardContent}
                            onChange={(e) => setNewCardContent(e.target.value)}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleAddCard();
                                }
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <Button type="primary" size="small" onClick={handleAddCard}>Adicionar</Button>
                            <Button type="text" size="small" onClick={() => setIsAddingCard(false)}>X</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="text"
                        block
                        icon={<Plus size={14} />}
                        className="text-gray-500 hover:bg-gray-200/50 text-left justify-start"
                        onClick={() => setIsAddingCard(true)}
                    >
                        Adicionar cartão
                    </Button>
                )}
            </div>
        </div>
    );
};

export default BoardColumn;
