import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: "Uninova Hub | Tech-Noir Dashboard",
  description: "Modernized dashboard for Uninova Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased overflow-hidden">
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

              <Header />

              <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 scrollbar-hide">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
