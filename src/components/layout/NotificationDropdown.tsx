'use client';

import React, { useEffect, useState } from 'react';
import { Dropdown, Badge } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, User as UserIcon } from 'lucide-react';
import { useProjectStore } from '@/store/kanbanStore';
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

    const handleNotificationClick = async (notif: any) => {
        await markNotificationAsRead(notif.id);
        setIsOpen(false);
        // Set active project and push to board
        useProjectStore.getState().setActiveProject(notif.projectId);
        router.push('/');
    };

    const content = (
        <div className="w-80 md:w-96 bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-widest">Avisos do Sistema</span>
                {notifications.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }}
                        className="text-[10px] font-semibold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10"
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
                            className="p-8 text-center text-zinc-500 text-[10px] font-medium tracking-widest uppercase flex flex-col items-center gap-3"
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
                                className="group p-4 border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-all relative flex flex-col gap-2"
                            >
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className="shrink-0 mt-0.5">
                                        {n.activityUserAvatar ? (
                                            <img src={n.activityUserAvatar} alt={n.activityUserName} className="w-9 h-9 rounded-full object-cover border border-white/10 shadow-sm block" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shadow-sm">
                                                <UserIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className="text-sm text-zinc-300 leading-snug">
                                                <span className="font-semibold text-white">{n.activityUserName}</span> mencionou você na tarefa <span className="text-zinc-500">#{n.taskId?.substring(0, 6) || '...'}</span> do projeto <span className="font-medium text-zinc-400">{n.projectName}</span>
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-zinc-500 flex items-center justify-between mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await markNotificationAsRead(n.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-0.5 rounded"
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
            <div className="relative group p-2 mx-2 cursor-pointer transition-colors duration-300 hover:bg-white/5 rounded-full select-none">
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
                        <Bell size={18} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </motion.div>
                </Badge>
            </div>
        </Dropdown>
    );
};
