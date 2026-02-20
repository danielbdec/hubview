'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    KanbanSquare,
    Settings,
    Menu,
    ChevronLeft,
    LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const menuItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', href: '/' },
    { icon: KanbanSquare, label: 'PROJETOS', href: '/projects' },
    { icon: Settings, label: 'CONFIGURAÇÕES', href: '/settings' },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('hubview_user');
        document.cookie = 'hubview_auth=; path=/; max-age=0';
        router.push('/login');
    };

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
                    {!isCollapsed ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2.5"
                        >
                            <Image src="/logo-uninova.png" alt="HubView" width={24} height={24} className="shrink-0" />
                            <span className="font-sans font-black tracking-tighter uppercase text-[var(--foreground)]">HubView</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center"
                        >
                            <Image src="/logo-uninova.png" alt="HubView" width={22} height={22} />
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
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
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
                                        className="font-sans text-[13px] font-bold tracking-tighter whitespace-nowrap uppercase"
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

            {/* Footer */}
            <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={cn(
                        'w-full group flex items-center gap-3 px-3 py-2.5 rounded-none transition-all duration-200 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/5',
                        isCollapsed && 'justify-center'
                    )}
                >
                    <LogOut size={18} />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-sans text-xs font-bold tracking-tighter uppercase"
                            >
                                SAIR
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* System Status */}
                <div className={cn("text-[10px] text-[var(--muted-foreground)] font-sans font-semibold tracking-tighter uppercase flex items-center gap-2", isCollapsed && "justify-center")}>
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                    {!isCollapsed && <span>SISTEMA ONLINE</span>}
                </div>
            </div>
        </motion.aside>
    );
}
