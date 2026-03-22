'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    KanbanSquare,
    Settings,
    Users,
    Pin,
    PinOff,
    LogOut,
    X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const menuItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', href: '/' },
    { icon: KanbanSquare, label: 'PROJETOS', href: '/projects' },
    { icon: Users, label: 'USUÁRIOS', href: '/users' },
    { icon: Settings, label: 'CONFIGURAÇÕES', href: '/settings' },
];

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    isMobile?: boolean;
}

export function Sidebar({ isMobileOpen, onMobileClose, isMobile }: SidebarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const pathname = usePathname();
    const router = useRouter();

    // Hydration check and load preferences
    useEffect(() => {
        setIsMounted(true);
        const savedPin = localStorage.getItem('hubview_sidebar_pinned');
        if (savedPin === 'true') {
            setIsPinned(true);
        }
    }, []);

    const togglePin = () => {
        const newPinnedState = !isPinned;
        setIsPinned(newPinnedState);
        localStorage.setItem('hubview_sidebar_pinned', String(newPinnedState));
    };

    const handleLogout = async () => {
        // Clear server-side HttpOnly cookies via API
        await fetch('/api/auth/logout', { method: 'POST' });
        // Clear client-side data
        localStorage.removeItem('hubview_user');
        router.push('/login');
    };

    const handleNavClick = () => {
        // Close mobile drawer on navigation
        if (isMobile && onMobileClose) {
            onMobileClose();
        }
    };

    const isExpanded = isMobile ? true : (isPinned || isHovered);

    if (!isMounted) {
        if (isMobile) return null;
        // Render a basic 80px sidebar during SSR to prevent layout shift before hydration
        return <aside className="h-screen w-[80px] bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] z-50 flex-shrink-0 hidden md:block" />;
    }

    // Mobile Drawer Mode
    if (isMobile) {
        return (
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mobile-drawer-overlay"
                            onClick={onMobileClose}
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                            className="fixed left-0 top-0 bottom-0 w-[260px] bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-[70] text-[var(--foreground)] shadow-[var(--surface-shadow)]"
                        >
                            {/* Brand Header */}
                            <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--sidebar-border)] overflow-hidden">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Image src="/logo-uninova.png" alt="HubView" width={24} height={24} className="shrink-0" />
                                    <span className="font-sans font-black tracking-tighter uppercase text-[var(--foreground)] truncate">HubView</span>
                                </div>
                                <button
                                    onClick={onMobileClose}
                                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 py-6 space-y-1 px-3 overflow-hidden">
                                {menuItems.map((item) => {
                                    const isActive = item.href === '/'
                                        ? pathname === '/'
                                        : pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={handleNavClick}
                                            className={cn(
                                                'group flex items-center gap-3 py-3.5 px-3 rounded-none transition-all duration-200 relative overflow-hidden',
                                                isActive
                                                    ? 'text-[var(--sidebar-menu-active)] bg-[var(--card-hover)]'
                                                    : 'text-[var(--sidebar-menu-inactive)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-nav-mobile"
                                                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--primary)]"
                                                />
                                            )}
                                            <item.icon size={20} className={cn('transition-colors shrink-0', isActive && 'text-[var(--primary)]')} />
                                            <span className="font-sans text-[13px] font-bold tracking-tighter whitespace-nowrap uppercase">
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Footer */}
                            <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2 overflow-hidden">
                                <button
                                    onClick={handleLogout}
                                    className="w-full group flex items-center gap-3 py-2.5 px-3 rounded-none transition-all duration-200 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/5"
                                >
                                    <LogOut size={18} className="shrink-0" />
                                    <span className="font-sans text-xs font-bold tracking-tighter uppercase whitespace-nowrap">SAIR</span>
                                </button>

                                <div className="text-[10px] text-[var(--muted-foreground)] font-sans font-semibold tracking-tighter uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shrink-0" />
                                    <span className="whitespace-nowrap">SISTEMA ONLINE</span>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }

    // Desktop Mode (original behavior)
    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 240 : 80 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative h-screen bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-50 text-[var(--foreground)] flex-shrink-0 hidden md:flex"
        >
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--sidebar-border)] overflow-hidden">
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div
                            key="expanded-logo"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2.5 min-w-0"
                        >
                            <Image src="/logo-uninova.png" alt="HubView" width={24} height={24} className="shrink-0" />
                            <span className="font-sans font-black tracking-tighter uppercase text-[var(--foreground)] truncate">HubView</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed-logo"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center w-full"
                        >
                            <Image src="/logo-uninova.png" alt="HubView" width={22} height={22} className="shrink-0" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pin Toggle Button */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={togglePin}
                            title={isPinned ? "Desafixar Sidebar" : "Fixar Sidebar"}
                            className="p-1.5 ml-2 hover:bg-[var(--card-hover)] rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors flex-shrink-0"
                        >
                            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-1 px-3 overflow-hidden">
                {menuItems.map((item) => {
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={!isExpanded ? item.label : undefined}
                            className={cn(
                                'group flex items-center gap-3 py-3 rounded-none transition-all duration-200 relative overflow-hidden',
                                isExpanded ? 'px-3' : 'px-0 justify-center',
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
                                className={cn('transition-colors shrink-0', isActive && 'text-[var(--primary)]')}
                            />

                            <AnimatePresence>
                                {isExpanded && (
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
            <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2 overflow-hidden">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    title={!isExpanded ? "Sair" : undefined}
                    className={cn(
                        'w-full group flex items-center gap-3 py-2.5 rounded-none transition-all duration-200 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/5',
                        isExpanded ? 'px-3' : 'px-0 justify-center'
                    )}
                >
                    <LogOut size={18} className="shrink-0" />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-sans text-xs font-bold tracking-tighter uppercase whitespace-nowrap"
                            >
                                SAIR
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* System Status */}
                <div className={cn("text-[10px] text-[var(--muted-foreground)] font-sans font-semibold tracking-tighter uppercase flex items-center gap-2", !isExpanded && "justify-center")}>
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shrink-0" />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                SISTEMA ONLINE
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
}
