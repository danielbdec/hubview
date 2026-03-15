'use client';

import { useState } from 'react';
import { CheckSquare, Plus, Eye, EyeOff, Trash2, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    position?: number;
}

interface TaskChecklistProps {
    checklist: ChecklistItem[];
    onChange: (checklist: ChecklistItem[]) => void;
}

export function TaskChecklist({ checklist, onChange }: TaskChecklistProps) {
    const [newItemText, setNewItemText] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);

    const total = checklist.length;
    const completed = checklist.filter(i => i.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const addItem = () => {
        if (!newItemText.trim()) return;
        const newItem: ChecklistItem = {
            id: uuidv4(),
            text: newItemText,
            completed: false,
            position: checklist.length,
        };
        onChange([...checklist, newItem]);
        setNewItemText('');
    };

    const toggleItem = (itemId: string) => {
        onChange(
            checklist.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const deleteItem = (itemId: string) => {
        onChange(checklist.filter(item => item.id !== itemId));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <CheckSquare size={16} />
                    <label className="text-xs font-mono uppercase tracking-wider">Checklist</label>
                </div>
                {total > 0 && (
                    <button
                        onClick={() => setHideCompleted(!hideCompleted)}
                        className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                        {hideCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
                        {hideCompleted ? 'Mostrar itens marcados' : 'Ocultar itens marcados'}
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="flex items-center gap-3 mb-4">
                    <span className={cn(
                        "text-xs font-mono min-w-[40px] font-bold tracking-tight",
                        progress === 100 ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                    )}>
                        {progress}%
                    </span>
                    <div className="flex-1 h-3 bg-[var(--input-border)] rounded-none overflow-hidden border border-black/20">
                        <div
                            className={cn(
                                "h-full transition-all duration-300 ease-out",
                                progress === 100 ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* List Items */}
            <div className="space-y-2">
                {checklist.map((item) => {
                    if (hideCompleted && item.completed) return null;
                    return (
                        <div key={item.id} className="flex items-start gap-3 group/item p-1 hover:bg-[var(--input-bg)]/50 transition-colors">
                            <button
                                type="button"
                                onClick={() => toggleItem(item.id)}
                                className={cn(
                                    "mt-0.5 w-4 h-4 rounded-none border flex-shrink-0 flex items-center justify-center transition-none",
                                    item.completed
                                        ? "bg-[var(--primary)] border-[var(--primary)]"
                                        : "bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--primary)]/50"
                                )}
                            >
                                {item.completed && <Check size={12} className="text-black stroke-[3]" />}
                            </button>
                            <div className={cn(
                                "flex-1 text-xs font-mono tracking-tight transition-none pt-0.5",
                                item.completed ? "text-[var(--muted-foreground)] opacity-50 line-through" : "text-[var(--foreground)]"
                            )}>
                                {item.text}
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 p-1 opacity-0 group-hover/item:opacity-100 transition-none"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Item Input */}
            <div className="flex mt-3 shadow-sm border border-[var(--input-border)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]">
                <input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Adicionar nova subtarefa..."
                    className="flex-1 bg-[var(--input-bg)] border-none text-[var(--foreground)] h-10 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-[var(--muted-foreground)]/50"
                />
                <button
                    onClick={addItem}
                    disabled={!newItemText.trim()}
                    className="px-4 bg-[var(--background)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-black border-l border-[var(--input-border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-mono text-xs uppercase tracking-wider"
                >
                    <Plus size={16} className="mr-1.5" /> Adicionar
                </button>
            </div>
        </div>
    );
}
