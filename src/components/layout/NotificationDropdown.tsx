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
        <div className="w-80 bg-[#0a1510] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-emerald-500/20 bg-emerald-900/10">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">AVISOS DO SISTEMA</span>
                {notifications.length > 0 && (
                    <button
                        onClick={() => markAllNotificationsAsRead()}
                        className="text-[10px] font-mono text-emerald-500/60 hover:text-emerald-400 uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                        <Check size={12} /> LIMPAR
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar bg-[#030806]/50">
                <AnimatePresence>
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center text-emerald-500/40 text-[10px] font-mono tracking-widest uppercase flex flex-col items-center gap-3 relative z-10"
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
                                className="group p-3 border-b border-emerald-500/10 hover:bg-emerald-900/20 cursor-pointer transition-colors relative overflow-hidden"
                            >
                                {/* Left accent line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                                <div className="flex items-start gap-3 relative z-10">
                                    <div className="shrink-0 mt-1">
                                        {n.activityUserAvatar ? (
                                            <img src={n.activityUserAvatar} alt={n.activityUserName} className="w-8 h-8 object-cover border border-emerald-500/30 ring-1 ring-emerald-500/10 block" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-none bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                <UserIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider truncate">{n.activityUserName}</span>
                                            <span className="text-[9px] text-emerald-500/50 font-mono flex items-center gap-1 shrink-0 whitespace-nowrap">
                                                <Clock size={10} />
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-emerald-100/70 line-clamp-2 leading-relaxed mb-1">
                                            "{n.activityContent}"
                                        </div>
                                        <div className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest truncate mt-1">
                                            ▷ {n.projectName}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            {/* Scanline overlay for aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" style={{ height: '50%', animation: 'scan 4s linear infinite' }} />
        </div>
    );

    return (
        <Dropdown
            dropdownRender={() => content}
            trigger={['click']}
            placement="bottomRight"
            open={isOpen}
            onOpenChange={setIsOpen}
            overlayStyle={{ zIndex: 9999 }}
        >
            <div className="relative group p-2 mx-2 cursor-pointer transition-colors duration-300 hover:bg-emerald-500/10 select-none">
                <Badge
                    count={unreadNotificationsCount}
                    offset={[-2, 2]}
                    size="small"
                    classNames={{ indicator: 'bg-emerald-500 text-[#030806] font-bold font-mono border-none shadow-[0_0_10px_rgba(16,185,129,0.5)]' }}
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
                        <Bell size={18} className="text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
                    </motion.div>
                </Badge>
                {/* Brutalist brackets for Bell */}
                <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-emerald-500/0 group-hover:border-emerald-500/50 transition-colors" />
                <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-emerald-500/0 group-hover:border-emerald-500/50 transition-colors" />
            </div>
        </Dropdown>
    );
};
