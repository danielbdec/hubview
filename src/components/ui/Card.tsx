import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'relative p-6 overflow-hidden transition-all duration-300',
                    // Sharp corners
                    'rounded-none',
                    {
                        'bg-[var(--card)] border border-[var(--card-border)] backdrop-blur-sm': variant === 'default',
                        'bg-[var(--sidebar)] border border-[var(--card-border)] backdrop-blur-xl shadow-[var(--surface-shadow-soft)]': variant === 'glass',
                        'bg-transparent border border-dashed border-[var(--card-border)]': variant === 'outline',
                    },
                    'group hover:border-[var(--primary)]',
                    className
                )}
                {...props}
            >
                {/* Tech Decoration: Top-right corner cut/accent */}
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H10V10L0 0Z" fill="var(--primary)" />
                    </svg>
                </div>

                {/* Background Grid Texture (Subtle) */}
                <div className="absolute inset-0 bg-tech-grid opacity-[0.05] pointer-events-none" />

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        );
    }
);
Card.displayName = 'Card';

export { Card };
