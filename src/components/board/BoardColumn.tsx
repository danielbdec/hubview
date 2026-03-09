import { useState } from 'react';
import { Button, Dropdown, MenuProps, Input } from 'antd';
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
        <div ref={setNodeRef} style={style} className="mr-6 flex h-full max-h-full w-80 flex-shrink-0 flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--surface-shadow-soft)] backdrop-blur-xl transition-colors">
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="group/header flex cursor-grab items-center justify-between border-b border-[var(--card-border)] p-4 active:cursor-grabbing"
            >
                <h3 className="flex-1 truncate text-base font-bold tracking-wide text-[var(--foreground)]">
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="rounded-full bg-[var(--column-bg)] px-2 py-0.5 font-mono">{cardIds.length}</span>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <button type="button" className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
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
                    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--sidebar)] p-3 shadow-[var(--surface-shadow-soft)] animate-in fade-in zoom-in-95 duration-200">
                        <Input.TextArea
                            autoFocus
                            placeholder="Título do cartão..."
                            className="mb-3 !resize-none !border-[var(--input-border)] !bg-[var(--input-bg)] !text-[var(--foreground)] placeholder:!text-[var(--muted-foreground)] focus:!border-[var(--primary)] focus:!shadow-none"
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
                            <Button type="text" size="small" onClick={() => setIsAddingCard(false)} className="!text-[var(--muted-foreground)] hover:!text-[var(--foreground)]">Cancelar</Button>
                            <Button type="primary" size="small" onClick={handleAddCard} className="!border-none !bg-[var(--primary)] !text-[var(--primary-foreground)] shadow-lg shadow-[rgba(132,204,22,0.18)] hover:!bg-[var(--primary-hover)]">Adicionar</Button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="group/btn flex w-full items-center justify-start gap-2 rounded-lg p-2.5 text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--card-hover)] hover:text-[var(--primary)]"
                        onClick={() => setIsAddingCard(true)}
                    >
                        <Plus size={18} className="text-[var(--muted-foreground)] transition-colors group-hover/btn:text-[var(--primary)]" />
                        <span className="font-medium">Adicionar cartão</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default BoardColumn;
