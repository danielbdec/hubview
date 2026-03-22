'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingParticles } from '@/components/auth/LoginEffects';
import { useMobile } from '@/hooks/useMobile';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const isMobile = useMobile();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <ThemeProvider defaultTheme="dark">
            <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
                {/* Desktop Sidebar (hidden on mobile via internal classes) */}
                <Sidebar
                    isMobile={isMobile}
                    isMobileOpen={isMobileMenuOpen}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Tech Background Image */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center opacity-15 mix-blend-luminosity pointer-events-none"
                        style={{
                            backgroundImage: `url('/bg-tech.png')`,
                        }}
                    />

                    {/* Tech Grid Background (Faint) */}
                    <div className="absolute inset-0 bg-tech-grid opacity-[0.05] pointer-events-none z-0" />

                    {/* Floating HUD Particles */}
                    <div className="absolute inset-0 z-0 opacity-[0.85] pointer-events-none">
                        <FloatingParticles />
                    </div>

                    <Header onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)} />

                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-28 md:pb-6 relative z-10 scrollbar-hide">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>

                {/* Bottom Navigation (mobile only) */}
                <BottomNav />
            </div>
        </ThemeProvider>
    );
}
