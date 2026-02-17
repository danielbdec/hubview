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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2 touch-none">
            <Card
                size="small"
                className="shadow-sm border-gray-200 hover:shadow-md cursor-grab active:cursor-grabbing group"
                bodyStyle={{ padding: '8px 12px' }}
            >
                <div className="flex justify-between items-start gap-2">
                    <Typography.Text className="whitespace-pre-wrap break-words flex-1">
                        {content}
                    </Typography.Text>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button
                            type="text"
                            size="small"
                            className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1"
                            icon={<MoreHorizontal size={14} />}
                        />
                    </Dropdown>
                </div>
            </Card>
        </div>
    );
};

export default BoardCard;
