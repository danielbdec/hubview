'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    KanbanSquare,
    Users,
    Settings,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: KanbanSquare, label: 'Projetos', href: '/projects' },
    { icon: Users, label: 'Usuários', href: '/users' },
    { icon: Settings, label: 'Config', href: '/settings' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="mobile-only fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)]/95 backdrop-blur-xl safe-bottom">
            <div className="flex items-center justify-around px-2 pt-2 pb-1">
                {navItems.map((item) => {
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]",
                                isActive
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--muted-foreground)] active:text-[var(--foreground)]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active"
                                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--primary)] rounded-full"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={22}
                                className={cn(
                                    "transition-all",
                                    isActive && "drop-shadow-[0_0_6px_rgba(169,239,47,0.5)]"
                                )}
                            />
                            <span className={cn(
                                "text-[9px] font-mono font-bold uppercase tracking-wider",
                                isActive && "text-[var(--primary)]"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
