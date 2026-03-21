'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingParticles } from '@/components/auth/LoginEffects';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider defaultTheme="dark">
            <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
                <Sidebar />

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

                    <Header />

                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 scrollbar-hide">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
