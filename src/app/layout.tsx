import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import StyledComponentsRegistry from '@/lib/AntdRegistry';
import ConfigProviderHelper from '@/lib/ConfigProviderHelper';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Uninova Hubview',
  description: 'Gestão à Vista - Projetos e Tarefas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ConfigProviderHelper>
            {children}
          </ConfigProviderHelper>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
