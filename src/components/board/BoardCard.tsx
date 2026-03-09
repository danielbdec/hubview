import { Dropdown, MenuProps } from 'antd';
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
            <div className="cursor-grab rounded-xl border border-[var(--card-border)] bg-[var(--sidebar)] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:bg-[var(--card-hover)] hover:shadow-[var(--surface-shadow-soft)] active:cursor-grabbing">
                <div className="flex justify-between items-start gap-3">
                    <span className="flex-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-[var(--foreground)]">
                        {content}
                    </span>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <button
                            type="button"
                            className="-mr-2 -mt-2 rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all group-hover/card:opacity-100 hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
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
