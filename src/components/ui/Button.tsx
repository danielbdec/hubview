import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Spinner } from '@/components/ui/Spinner';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'status';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
        const isDisabled = Boolean(disabled || isLoading);

        return (
            <button
                ref={ref}
                className={cn(
                    // Base
                    'hubview-button group/button relative inline-flex items-center justify-center overflow-hidden rounded-none font-mono font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
                    {
                        // Primary: solid acid green with scanline hover
                        'hubview-button--primary bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[3px_3px_0px_rgba(169,239,47,0.25)]': variant === 'primary',
                        // Secondary: outlined with wipe-fill hover
                        'hubview-button--secondary border border-[var(--primary)] bg-transparent text-[var(--primary)] hover:text-[var(--primary-foreground)]': variant === 'secondary',
                        // Ghost
                        'hubview-button--ghost bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]': variant === 'ghost',
                        // Danger
                        'hubview-button--danger border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20': variant === 'danger',
                        // Status badge: thin border, transparent, terminal vibe
                        'hubview-button--status cursor-default border border-[var(--primary)]/40 bg-transparent text-[var(--primary)] hover:border-[var(--primary)]': variant === 'status',
                        // Sizes
                        'h-8 px-4 text-[10px] gap-1.5': size === 'sm',
                        'h-10 px-6 text-xs gap-2': size === 'md',
                        'h-12 px-8 text-sm gap-2.5': size === 'lg',
                    },
                    className
                )}
                disabled={isDisabled}
                {...props}
            >
                <span
                    className="hubview-button__shine pointer-events-none absolute inset-y-0 -left-[28%] w-[28%]"
                    aria-hidden="true"
                />

                {/* Scanline overlay for primary on hover */}
                {variant === 'primary' && (
                    <span
                        className="hubview-button__scanline pointer-events-none absolute inset-0 opacity-0"
                        aria-hidden="true"
                    />
                )}

                {/* Wipe-fill background for secondary on hover */}
                {variant === 'secondary' && (
                    <span
                        className="hubview-button__fill pointer-events-none absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover/button:scale-x-100"
                        aria-hidden="true"
                        style={{ zIndex: 0 }}
                    />
                )}

                {/* Loading spinner */}
                {isLoading ? (
                    <Spinner size="sm" tone="current" className="mr-2" />
                ) : null}

                {/* Content (above wipe layer) */}
                <span className="relative z-10 inline-flex items-center gap-inherit">
                    {children}
                </span>

                {/* Corner Accents — sharper, more visible */}
                <span className="hubview-button__corner pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-current opacity-40" />
                <span className="hubview-button__corner pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-current opacity-40" />

                {/* Status variant: pulsing dot */}
                {variant === 'status' && (
                    <span className="relative z-10 w-1.5 h-1.5 bg-[var(--primary)] shadow-[0_0_6px_rgba(169,239,47,0.6)] animate-pulse ml-1" aria-hidden="true" />
                )}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
