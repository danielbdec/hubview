import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'relative inline-flex items-center justify-center font-mono font-bold uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tech-green focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
                    'before:absolute before:inset-0 before:z-[-1] before:transition-transform before:duration-200',
                    {
                        'bg-tech-green text-black hover:bg-tech-green/90': variant === 'primary',
                        'bg-transparent border border-tech-border text-tech-green hover:bg-white/5': variant === 'secondary',
                        'bg-transparent text-gray-400 hover:text-white hover:bg-white/5': variant === 'ghost',
                        'bg-tech-red/10 text-tech-red border border-tech-red/50 hover:bg-tech-red/20': variant === 'danger',
                        'h-8 px-4 text-xs': size === 'sm',
                        'h-10 px-6 text-sm': size === 'md',
                        'h-12 px-8 text-base': size === 'lg',
                    },
                    // Tech specific styles: Sharp corners
                    'rounded-none',
                    // Glitch effect on hover for primary
                    variant === 'primary' && 'hover:shadow-[2px_2px_0px_rgba(255,255,255,0.2)]',
                    className
                )}
                disabled={isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 animate-spin">
                        {/* Simple spinner SVG */}
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </span>
                ) : null}
                {children}
                {/* Corner Accents */}
                <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-50" />
                <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-50" />
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
