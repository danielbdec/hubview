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
    onAddComment: (content: string, mentionedUserIds: string[]) => Promise<void>;
}

export function TaskActivitySidebar({
    activities,
    isLoading,
    users = [],
    onAddComment,
}: TaskActivitySidebarProps) {
    const { theme: themeMode } = useTheme();
    const [newContent, setNewContent] = useState('');

    const handleSubmit = async () => {
        if (!newContent.trim()) return;

        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentions = Array.from(newContent.matchAll(mentionRegex)).map(m => m[1]);
        const validMentionedUserIds = users
            .filter(u => mentions.includes(u.name.replace(/\s+/g, '')))
            .map(u => u.id);

        await onAddComment(newContent, validMentionedUserIds);
        setNewContent('');
    };

    const renderContentWithMentions = (content: string) => {
        if (!content || typeof content !== 'string') return content;
        
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const parts = content.split(mentionRegex);
        
        if (parts.length <= 1) return content;

        return parts.map((part, index) => {
            if (index % 2 === 1) {
                const isKnownUser = users.some(u => u.name.replace(/\s+/g, '') === part);
                return (
                    <span 
                        key={index} 
                        className={cn(
                            "font-bold transition-colors", 
                            isKnownUser ? "text-[var(--primary)] hover:underline cursor-pointer" : "text-blue-400"
                        )}
                        title={isKnownUser ? `Mencionando ${part}` : undefined}
                    >
                        @{part}
                    </span>
                );
            }
            return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    return (
        <div className="flex flex-col h-full bg-[var(--sidebar)] border-l border-[var(--sidebar-border)] w-[400px] shrink-0 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between px-6 h-[81px] border-b border-white/5 bg-gradient-to-b from-[var(--primary)]/5 to-transparent shrink-0 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)] shadow-[0_0_15px_var(--primary)]" />
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 bg-[var(--primary)] animate-ping absolute inset-0 opacity-50" />
                        <div className="w-2 h-2 bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                    </div>
                    <h3 className="text-sm font-bold font-mono tracking-[0.2em] text-[var(--primary)] uppercase drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                        Histórico & Logs
                    </h3>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><Spin /></div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-[var(--primary)] opacity-70 text-[13px] font-mono py-8 h-full flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <Activity size={32} className="opacity-80 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-20" />
                        </div>
                        <span className="tracking-[0.15em] uppercase border-b border-[var(--primary)]/30 pb-1">Nenhuma informação</span>
                        <span className="text-[10px] text-[var(--primary)]/60 bg-[var(--primary)]/5 px-2 py-1">Aguardando inserção de logs...</span>
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
                                    {renderContentWithMentions(act.content)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="shrink-0 p-5 pt-4 border-t border-[var(--primary)]/10 bg-black/60 relative backdrop-blur-md shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.8)]">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
                <ConfigProvider
                    theme={{
                        algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                        token: {
                            colorPrimary: 'var(--primary)',
                            colorText: 'var(--primary)',
                            colorTextPlaceholder: 'rgba(34,197,94,0.4)',
                            colorBgContainer: 'rgba(0,0,0,0.5)',
                            colorBorder: 'rgba(34,197,94,0.2)',
                            colorBgElevated: '#0a0a0a',
                            borderRadius: 0,
                        },
                    }}
                >
                    <Mentions
                        value={newContent}
                        onChange={setNewContent}
                        placeholder="[ CONSOLE ] Escreva o log ou use @ p/ mencionar..."
                        className="w-full h-24 !bg-black/60 border border-[var(--primary)]/30 !text-[var(--primary)] p-3.5 text-[13px] focus-within:outline-none focus-within:!border-[var(--primary)] transition-all hover:border-[var(--primary)]/60 resize-none font-mono rounded-none mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                        options={users.map(u => ({ value: u.name.replace(/\s+/g, ''), label: u.name }))}
                        autoSize={{ minRows: 3, maxRows: 5 }}
                    />
                </ConfigProvider>
                <Button
                    variant="primary"
                    className="w-full rounded-none font-mono tracking-[0.2em] text-xs h-11 bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300 disabled:opacity-30 disabled:grayscale"
                    onClick={handleSubmit}
                    disabled={!newContent.trim() || isLoading}
                >
                    <ArrowRight size={16} className="mr-3" /> ENVIAR
                </Button>
            </div>
        </div>
    );
}
