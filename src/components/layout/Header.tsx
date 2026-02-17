'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Assuming Button is available
import { Input } from '@/components/ui/Input';   // Assuming Input is available

export function Header() {
    const pathname = usePathname();
    const breadcrumbs = pathname.split('/').filter(Boolean);

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
            {/* Breadcrumbs / Page Title */}
            <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-xs uppercase tracking-wider">/</span>
                <span className="text-white font-bold font-mono uppercase tracking-widest">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : 'Dashboard'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <div className="w-64 hidden md:block">
                    <Input placeholder="SEARCH_COMMAND..." className="h-8 text-xs bg-white/5 border-white/10" />
                </div>

                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                    <Button variant="ghost" size="sm" className="w-8 h-8 px-0">
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
