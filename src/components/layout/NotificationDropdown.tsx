'use client';

import React, { useEffect, useState } from 'react';
import { Dropdown, Badge } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, User as UserIcon } from 'lucide-react';
import { Notification, useProjectStore } from '@/store/kanbanStore';
import { useRouter } from 'next/navigation';

export const NotificationDropdown = () => {
    const router = useRouter();
    const {
        notifications,
        unreadNotificationsCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    } = useProjectStore();

    const [isOpen, setIsOpen] = useState(false);

    // Polling setup directly on the component
    useEffect(() => {
        // Fetch initially
        fetchNotifications();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleNotificationClick = async (notif: Notification) => {
        await markNotificationAsRead(notif.id);
        setIsOpen(false);
        // Set active project and push to board
        useProjectStore.getState().setActiveProject(notif.projectId);
        router.push('/');
    };

    const content = (
        <div className="w-80 overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--sidebar)] shadow-[var(--surface-shadow)] backdrop-blur-2xl md:w-96">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-hover)] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]">Avisos do Sistema</span>
                {notifications.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }}
                        className="flex items-center gap-1.5 rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                    >
                        <Check size={12} /> LER TODAS
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-3 p-8 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]"
                        >
                            <Bell size={24} className="opacity-30" />
                            NENHUM AVISO
                        </motion.div>
                    ) : (
                        notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => handleNotificationClick(n)}
                                className="group relative flex cursor-pointer flex-col gap-2 border-b border-[var(--card-border)] p-4 transition-all hover:bg-[var(--card-hover)]"
                            >
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className="shrink-0 mt-0.5">
                                        {n.activityUserAvatar ? (
                                            <img src={n.activityUserAvatar} alt={n.activityUserName} className="block h-9 w-9 rounded-full border border-[var(--card-border)] object-cover shadow-sm" />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--column-bg)] text-[var(--muted-foreground)] shadow-sm">
                                                <UserIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className="text-sm leading-snug text-[var(--muted-foreground)]">
                                                <span className="font-semibold text-[var(--foreground)]">{n.activityUserName}</span> mencionou você na tarefa <span className="text-[var(--muted-foreground)]">#{n.taskId?.substring(0, 6) || '...'}</span> do projeto <span className="font-medium text-[var(--foreground)]">{n.projectName}</span>
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await markNotificationAsRead(n.id);
                                                }}
                                                className="flex items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 font-medium text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <Check size={10} />
                                                Marcar lida
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    return (
        <Dropdown
            popupRender={() => content}
            trigger={['click']}
            placement="bottomRight"
            open={isOpen}
            onOpenChange={setIsOpen}
            overlayStyle={{ zIndex: 9999 }}
        >
            <div className="group relative mx-2 cursor-pointer select-none rounded-full p-2 transition-colors duration-300 hover:bg-[var(--card-hover)]">
                <Badge
                    count={unreadNotificationsCount}
                    offset={[-2, 2]}
                    size="small"
                    classNames={{ indicator: 'bg-red-500 text-white font-bold font-mono border-none shadow-[0_0_10px_rgba(239,68,68,0.5)]' }}
                >
                    <motion.div
                        animate={unreadNotificationsCount > 0 ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -10, 10, -10, 0]
                        } : {}}
                        transition={{
                            duration: 0.5,
                            repeat: unreadNotificationsCount > 0 ? Infinity : 0,
                            repeatDelay: 5
                        }}
                    >
                        <Bell size={18} className="text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]" />
                    </motion.div>
                </Badge>
            </div>
        </Dropdown>
    );
};
