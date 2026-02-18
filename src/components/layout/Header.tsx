'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Assuming Button is available
import { Input } from '@/components/ui/Input';   // Assuming Input is available
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
    const pathname = usePathname();
    const breadcrumbs = pathname.split('/').filter(Boolean);

    const breadnameMap: Record<string, string> = {
        'projects': 'PROJETOS',
        'dashboard': 'DASHBOARD',
        'logs': 'LOGS',
        'settings': 'CONFIGURAÇÕES'
    };

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--header-border)] bg-[var(--header)] backdrop-blur-md sticky top-0 z-40">
            {/* Breadcrumbs / Page Title */}
            <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)] font-mono text-xs uppercase tracking-wider">/</span>
                <span className="text-[var(--foreground)] font-bold font-mono uppercase tracking-widest">
                    {breadcrumbs.length > 0 ? (breadnameMap[breadcrumbs[breadcrumbs.length - 1]] || breadcrumbs[breadcrumbs.length - 1]) : 'DASHBOARD'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <div className="w-64 hidden md:block">
                    <Input placeholder="PESQUISAR..." className="h-8 text-xs bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)]" />
                </div>

                <div className="flex items-center gap-2 border-l border-[var(--header-border)] pl-4">
                    <ThemeToggle />
                    <Button variant="ghost" size="sm" className="w-8 h-8 px-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        <Bell size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-8 h-8 px-0">
                        <User size={16} />
                    </Button>
                </div>
            </div>
        </header>
    );
}
