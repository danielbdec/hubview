'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    KanbanSquare,
    Settings,
    Menu,
    ChevronLeft,
    Terminal,
    Cpu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: KanbanSquare, label: 'Projetos', href: '/projects' },
    { icon: Terminal, label: 'Logs', href: '/logs' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ width: 240 }}
            animate={{ width: isCollapsed ? 80 : 240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative h-screen bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-50 text-[var(--foreground)]"
        >
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--sidebar-border)]">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <Cpu className="text-[var(--primary)] w-5 h-5" />
                            <span className="font-mono font-bold tracking-wider text-[var(--foreground)]">UNINOVA</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-[var(--card-hover)] rounded-none text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-1 px-3">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-3 rounded-none transition-all duration-200 relative overflow-hidden',
                                isActive
                                    ? 'text-[var(--sidebar-menu-active)] bg-[var(--card-hover)]'
                                    : 'text-[var(--sidebar-menu-inactive)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                            )}
                        >
                            {/* Active Indicator Line */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--primary)]"
                                />
                            )}

                            <item.icon
                                size={20}
                                className={cn('transition-colors', isActive && 'text-[var(--primary)]')}
                            />

                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="font-mono text-sm tracking-wide whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Hover glitch effect line */}
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--sidebar-border)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Info */}
            <div className="p-4 border-t border-[var(--sidebar-border)]">
                <div className={cn("text-[10px] text-[var(--muted-foreground)] font-mono flex items-center gap-2", isCollapsed && "justify-center")}>
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                    {!isCollapsed && <span>SYSTEM ONLINE</span>}
                </div>
            </div>
        </motion.aside>
    );
}
