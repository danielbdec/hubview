import React from 'react';
import { Card, Typography, Button, Dropdown, MenuProps } from 'antd';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

interface BoardCardProps {
    id: string;
    content: string;
    columnId: string;
}

const BoardCard: React.FC<BoardCardProps> = ({ id, content, columnId }) => {
    const deleteCard = useBoardStore((state) => state.deleteCard);

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
            type: 'Card',
            card: { id, content, columnId }
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'delete',
            label: 'Excluir',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: () => deleteCard(columnId, id)
        }
    ];

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none group/card relative perspective-1000">
            <div className="bg-[#1e293b]/50 backdrop-blur-md hover:bg-[#1e293b]/70 p-4 rounded-xl border border-white/5 shadow-sm hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start gap-3">
                    <span className="text-gray-200 text-sm whitespace-pre-wrap break-words flex-1 leading-relaxed font-medium">
                        {content}
                    </span>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <button
                            type="button"
                            className="text-gray-500 hover:text-white opacity-0 group-hover/card:opacity-100 transition-all p-1.5 -mr-2 -mt-2 rounded-md hover:bg-white/10"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};

export default BoardCard;
