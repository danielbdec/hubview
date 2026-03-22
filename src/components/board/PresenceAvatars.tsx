'use client';

import { useSocketStore } from '@/store/socketStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

export function PresenceAvatars() {
    const onlineUsers = useSocketStore(state => state.onlineUsers);

    if (onlineUsers.length === 0) return null;

    // Show up to 4 users, group the rest
    const visibleUsers = onlineUsers.slice(0, 4);
    const hiddenCount = onlineUsers.length - visibleUsers.length;

    return (
        <div className="flex items-center ml-4 border-l border-[var(--border)] pl-4 h-8 shrink-0">
            <div className="flex -space-x-2 items-center">
                <AnimatePresence>
                    {visibleUsers.map((user, idx) => {
                        const initials = user.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--card)] font-mono text-[9px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-transparent transition-transform hover:z-10 hover:scale-110"
                                style={{ backgroundColor: user.color }}
                                title={`${user.name} online na sala`}
                            >
                                {initials}
                                {/* Pulse light */}
                                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full border border-[var(--card)] bg-green-400"></span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {hiddenCount > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--card-hover)] font-mono text-[9px] font-bold text-[var(--foreground)] ring-1 ring-[var(--border)]"
                    >
                        +{hiddenCount}
                    </motion.div>
                )}
            </div>
            <div className="ml-2 hidden lg:flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                <Users size={12} className="text-emerald-400" />
                <span className="text-emerald-500 font-bold">{onlineUsers.length} ONLINE</span>
            </div>
        </div>
    );
}
