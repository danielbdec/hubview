'use client';

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useProjectStore } from '@/store/kanbanStore';
import { Segmented, ConfigProvider, theme as antdTheme } from 'antd';
import { KanbanIcon, ListIcon, CalendarIcon, GanttChart } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { CommandPalette } from './CommandPalette';

const breadnameMap: Record<string, string> = {
    'projects': 'PROJETOS',
    'dashboard': 'DASHBOARD',
    'logs': 'LOGS',
    'settings': 'CONFIGURAÇÕES'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Header() {
    const pathname = usePathname();
    const { theme: themeMode } = useTheme();
    const { projects, activeView, setActiveView } = useProjectStore();
    const segments = pathname.split('/').filter(Boolean);

    // Build smart breadcrumb: resolve UUIDs to project names
    const breadcrumbParts = segments.map(seg => {
        if (breadnameMap[seg]) return breadnameMap[seg];
        if (UUID_REGEX.test(seg)) {
            return null; // Hide project name since it's already displayed below
        }
        return seg.toUpperCase();
    }).filter(Boolean) as string[];

    const displayText = breadcrumbParts.length > 0
        ? breadcrumbParts.join(' / ')
        : 'DASHBOARD';

    const isProjectPage = segments.length === 2 && segments[0] === 'projects' && UUID_REGEX.test(segments[1]);

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--header-border)] bg-[var(--header)] backdrop-blur-md sticky top-0 z-40 relative">
            {/* Breadcrumbs / Page Title */}
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[var(--muted-foreground)] font-sans text-xs uppercase tracking-tight">/</span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={displayText}
                        initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-[var(--foreground)] font-black font-sans uppercase tracking-tighter text-sm"
                    >
                        {displayText}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {isProjectPage && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
                        <ConfigProvider
                            theme={{
                                algorithm: themeMode === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
                                token: {
                                    colorPrimary: 'var(--primary)',
                                    fontFamily: 'var(--font-geist-sans)',
                                    colorText: 'var(--foreground)',
                                    colorTextSecondary: 'var(--muted-foreground)',
                                    colorBgElevated: 'var(--sidebar)',
                                },
                                components: {
                                    Segmented: {
                                        itemSelectedBg: 'var(--primary)',
                                        itemSelectedColor: '#000000',
                                        trackBg: 'var(--sidebar)',
                                        itemHoverBg: 'var(--card-hover)',
                                        itemHoverColor: 'var(--foreground)',
                                        controlPaddingHorizontal: 12
                                    }
                                }
                            }}
                        >
                            <div className="border border-[var(--input-border)] bg-[var(--sidebar)] p-0.5 flex rounded-sm overflow-hidden">
                                <Segmented
                                    value={activeView}
                                    onChange={(value) => setActiveView(value as 'kanban' | 'list' | 'calendar' | 'timeline')}
                                    className="bg-transparent font-mono text-[10px] tracking-widest uppercase [&_.ant-segmented-item-selected]:bg-[var(--primary)] [&_.ant-segmented-item-selected]:text-black [&_.ant-segmented-item-selected]:font-bold [&_.ant-segmented-item-selected]:!rounded-none [&_.ant-segmented-item]:!rounded-none [&_.ant-segmented-item]:text-[var(--muted-foreground)]"
                                    options={[
                                        { label: <div className="flex items-center gap-1.5 px-3 py-1"><KanbanIcon size={14} /> Kanban</div>, value: 'kanban' },
                                        { label: <div className="flex items-center gap-1.5 px-3 py-1"><ListIcon size={14} /> Lista</div>, value: 'list' },
                                        { label: <div className="flex items-center gap-1.5 px-3 py-1"><CalendarIcon size={14} /> Calendário</div>, value: 'calendar' },
                                        { label: <div className="flex items-center gap-1.5 px-3 py-1"><GanttChart size={14} /> Timeline</div>, value: 'timeline' },
                                    ]}
                                />
                            </div>
                        </ConfigProvider>
                    </div>
                )}

                <CommandPalette />

                <div className="flex items-center gap-2 border-l border-[var(--header-border)] pl-4">
                    <ThemeToggle />
                    <NotificationDropdown />
                    <Button variant="ghost" size="sm" className="w-8 h-8 px-0">
                        <User size={16} />
                    </Button>
                </div>
            </div>
        </header>
    );
}
