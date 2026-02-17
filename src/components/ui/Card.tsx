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
                        'bg-white/5 border border-white/10 backdrop-blur-sm': variant === 'default', // Slight transparency
                        'bg-black/40 border border-white/5 backdrop-blur-md': variant === 'glass',
                        'bg-transparent border border-dashed border-white/20': variant === 'outline',
                    },
                    'group hover:border-white/20', // Hover effect
                    className
                )}
                {...props}
            >
                {/* Tech Decoration: Top-right corner cut/accent */}
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H10V10L0 0Z" fill="var(--tech-green, #A9EF2F)" />
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
