import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'status';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    // Base
                    'relative inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] rounded-none overflow-hidden',
                    {
                        // Primary: solid acid green with scanline hover
                        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[3px_3px_0px_rgba(169,239,47,0.25)]': variant === 'primary',
                        // Secondary: outlined with wipe-fill hover
                        'bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:text-[var(--primary-foreground)]': variant === 'secondary',
                        // Ghost
                        'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]': variant === 'ghost',
                        // Danger
                        'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20': variant === 'danger',
                        // Status badge: thin border, transparent, terminal vibe
                        'bg-transparent border border-[var(--primary)]/40 text-[var(--primary)] cursor-default hover:border-[var(--primary)]': variant === 'status',
                        // Sizes
                        'h-8 px-4 text-[10px] gap-1.5': size === 'sm',
                        'h-10 px-6 text-xs gap-2': size === 'md',
                        'h-12 px-8 text-sm gap-2.5': size === 'lg',
                    },
                    className
                )}
                disabled={isLoading}
                {...props}
            >
                {/* Scanline overlay for primary on hover */}
                {variant === 'primary' && (
                    <span
                        className="absolute inset-0 opacity-0 hover-scanline pointer-events-none"
                        aria-hidden="true"
                    />
                )}

                {/* Wipe-fill background for secondary on hover */}
                {variant === 'secondary' && (
                    <span
                        className="absolute inset-0 bg-[var(--primary)] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 pointer-events-none"
                        aria-hidden="true"
                        style={{ zIndex: 0 }}
                    />
                )}

                {/* Loading spinner */}
                {isLoading ? (
                    <span className="mr-2 animate-spin">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </span>
                ) : null}

                {/* Content (above wipe layer) */}
                <span className="relative z-10 inline-flex items-center gap-inherit">
                    {children}
                </span>

                {/* Corner Accents — sharper, more visible */}
                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-40 pointer-events-none" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-40 pointer-events-none" />

                {/* Status variant: pulsing dot */}
                {variant === 'status' && (
                    <span className="relative z-10 w-1.5 h-1.5 bg-[var(--primary)] shadow-[0_0_6px_rgba(169,239,47,0.6)] animate-pulse ml-1" aria-hidden="true" />
                )}

                {/* Inline CSS for scanline effect */}
                <style>{`
                    button:hover .hover-scanline {
                        opacity: 1;
                    }
                    .hover-scanline {
                        background: repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 0, 0, 0.06) 2px,
                            rgba(0, 0, 0, 0.06) 4px
                        );
                        transition: opacity 0.3s ease;
                    }
                `}</style>
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
