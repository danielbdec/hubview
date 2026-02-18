'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: 'dark',
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'dark',
    storageKey = 'hubview-ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);

    useEffect(() => {
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, [storageKey]);

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old theme attribute if any
        root.removeAttribute('data-theme');

        // Use 'class' for Tailwind dark mode if configured, but we are using data-theme attribute for CSS vars
        root.setAttribute('data-theme', theme);

        // Also toggle 'dark' class just in case tailwind relies on it
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
