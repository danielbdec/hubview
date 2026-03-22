'use client';

import { useEffect, useState } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { useProjectStore } from '@/store/kanbanStore';
import { notification } from 'antd';
import { BellRing } from 'lucide-react';
import React from 'react';

export function GlobalNotifications() {
    const [api, contextHolder] = notification.useNotification();
    const currentUser = useProjectStore(state => state.currentUser);

    useEffect(() => {
        const handleMention = (e: Event) => {
            const customEvent = e as CustomEvent<{
                userIds: string[];
                taskId: string;
                taskTitle: string;
                authorName: string;
            }>;
            const payload = customEvent.detail;

            // Check if current user is among the mentioned users
            if (currentUser && currentUser.id && payload.userIds.includes(currentUser.id)) {
                api.info({
                    message: 'Você foi mencionado',
                    description: (
                        <div>
                            <span className="font-bold text-[var(--primary)]">{payload.authorName}</span> mencionou você na tarefa: <br />
                            <span className="italic text-[var(--muted-foreground)] text-xs mt-1 block">
                                {payload.taskTitle}
                            </span>
                        </div>
                    ),
                    placement: 'topRight',
                    duration: 8,
                    icon: <BellRing className="text-[var(--primary)] animate-pulse" size={24} />,
                    style: {
                        backgroundColor: 'var(--sidebar)',
                        border: '1px solid var(--primary)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace',
                        borderRadius: 0,
                    }
                });
                
                // Optionally fetch notifications if they are stored in DB
                useProjectStore.getState().fetchNotifications();
            }
        };

        window.addEventListener('mention-notification', handleMention);

        return () => {
            window.removeEventListener('mention-notification', handleMention);
        };
    }, [api, currentUser]);

    return <>{contextHolder}</>;
}
