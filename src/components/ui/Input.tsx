import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="w-full relative group">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        id={id}
                        className={cn(
                            'w-full bg-white/5 border border-white/10 text-white placeholder-gray-500',
                            'h-10 px-4 font-mono text-sm leading-none',
                            'focus:outline-none focus:border-tech-green focus:bg-white/10 transition-all duration-200',
                            'rounded-none', // Sharp corners
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            error && 'border-tech-red focus:border-tech-red',
                            className
                        )}
                        {...props}
                    />
                    {/* Active indicator line */}
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-tech-green transition-all duration-300 group-focus-within:w-full" />
                </div>

                {error && (
                    <p className="mt-1 text-xs text-tech-red font-mono">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
