'use client';

import { useState } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Spin, Mentions, ConfigProvider, theme as antdTheme } from 'antd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActivityItem {
    id: string;
    type: string;
    content: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface TaskActivitySidebarProps {
    activities: ActivityItem[];
    isLoading: boolean;
    users: UserOption[];
    onAddComment: (content: string) => Promise<void>;
}

export function TaskActivitySidebar({
    activities,
    isLoading,
    users,
    onAddComment,
}: TaskActivitySidebarProps) {
    const { theme: themeMode } = useTheme();
    const [newContent, setNewContent] = useState('');

    const handleSubmit = async () => {
        if (!newContent.trim()) return;
        await onAddComment(newContent);
        setNewContent('');
    };

    return (
        <div className="flex flex-col h-full bg-[var(--sidebar)] border-l border-[var(--sidebar-border)] w-[400px] shrink-0 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[var(--sidebar-border)] h-[81px] shrink-0 bg-[var(--background)]/50">
                <h3 className="text-sm font-bold font-mono tracking-widest text-[var(--foreground)] uppercase">
                    Histórico & Logs
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><Spin /></div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-[var(--muted-foreground)] text-xs font-mono py-8 h-full flex items-center justify-center">
                        Nenhuma atividade registrada na tarefa.
                    </div>
                ) : (
                    activities.map((act) => (
                        <div key={act.id} className="flex gap-3 text-sm font-mono group">
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "w-7 h-7 rounded-none flex items-center justify-center shrink-0 border transition-colors overflow-hidden",
                                    act.type === 'comment' || act.userName !== 'Sistema'
                                        ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                                        : "bg-[var(--input-bg)] text-[var(--muted-foreground)] border-[var(--sidebar-border)]"
                                )}>
                                    {act.userAvatar ? (
                                        <img
                                            src={act.userAvatar}
                                            alt={act.userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : act.type === 'comment' || act.userName !== 'Sistema' ? (
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(act.userName)}&background=22c55e&color=000000&rounded=false&bold=true&font-size=0.4`}
                                            alt={act.userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Activity size={12} />
                                    )}
                                </div>
                                <div className="w-[1px] h-full bg-[var(--sidebar-border)] my-1 group-last:hidden" />
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn(
                                        "font-bold",
                                        act.type === 'comment' ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                                    )}>
                                        {act.userName}
                                    </span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] opacity-70">
                                        {new Date(act.createdAt).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-none border",
                                    act.type === 'comment'
                                        ? "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)]"
                                        : "bg-transparent border-transparent text-[var(--muted-foreground)] text-xs -translate-x-3"
                                )}>
                                    {act.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="shrink-0 pt-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)]">
                <ConfigProvider
                    theme={{
                        algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                        token: {
                            colorPrimary: 'var(--primary)',
                            colorText: 'var(--foreground)',
                            colorTextPlaceholder: 'var(--muted-foreground)',
                            colorBgContainer: 'var(--background)',
                            colorBorder: 'var(--input-border)',
                            colorBgElevated: 'var(--sidebar)',
                            borderRadius: 0,
                        },
                    }}
                >
                    <Mentions
                        value={newContent}
                        onChange={setNewContent}
                        placeholder="Adicione um comentário para a equipe (use @ para mencionar)..."
                        className="w-full h-20 !bg-[var(--background)] border border-[var(--input-border)] !text-[var(--foreground)] p-3 text-sm focus-within:outline-none focus-within:!border-[var(--primary)] transition-colors hover:border-[var(--primary)] resize-none font-mono rounded-none mb-3"
                        options={users.map(u => ({ value: u.name.replace(/\s+/g, ''), label: u.name }))}
                        autoSize={{ minRows: 3, maxRows: 3 }}
                    />
                </ConfigProvider>
                <Button
                    variant="primary"
                    className="w-full rounded-none font-mono tracking-widest text-xs h-10"
                    onClick={handleSubmit}
                    disabled={!newContent.trim() || isLoading}
                >
                    <ArrowRight size={16} className="mr-2" /> ENVIAR COMENTÁRIO
                </Button>
            </div>
        </div>
    );
}
