import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hub View - Projetos",
  description: "Sistema de Gestão - Uninova Hub",
  icons: {
    icon: "/logo-uninova.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
