import { HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Spinner } from '@/components/ui/Spinner';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    eyebrow?: string;
    fullScreen?: boolean;
}

export function LoadingState({
    title = 'Sincronizando ambiente',
    description = 'Preparando interfaces, dados e estados visuais.',
    eyebrow = 'Hubview Control Layer',
    fullScreen = false,
    className,
    ...props
}: LoadingStateProps) {
    return (
        <div
            className={cn(
                'relative isolate flex w-full items-center justify-center overflow-hidden px-4',
                fullScreen ? 'min-h-screen py-6 sm:px-6' : 'min-h-[24rem] py-12',
                className
            )}
            {...props}
        >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: fullScreen
                            ? 'radial-gradient(circle at top, color-mix(in srgb, var(--primary) 16%, transparent), color-mix(in srgb, var(--background) 92%, transparent) 42%, var(--background) 100%)'
                            : 'radial-gradient(circle at top, color-mix(in srgb, var(--primary) 10%, transparent), transparent 58%)',
                    }}
                />
                <div
                    className="absolute left-1/2 top-[18%] h-52 w-52 -translate-x-1/2 rounded-full blur-3xl"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}
                />
                <div
                    className="absolute right-[12%] top-[30%] h-32 w-32 rounded-full blur-3xl"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--tech-dim) 72%, transparent)' }}
                />
                <div className="absolute inset-0 bg-tech-grid opacity-[0.06]" />
            </div>

            <div className="relative flex w-full max-w-[26rem] flex-col items-center px-6 text-center">
                <span className="mb-4 text-[10px] font-mono font-semibold uppercase tracking-[0.32em] text-[var(--muted-foreground)]">
                    {eyebrow}
                </span>

                <div className="mb-6 flex h-32 w-32 items-center justify-center">
                    <Spinner size={fullScreen ? 'xl' : 'lg'} />
                </div>

                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[var(--foreground)] sm:text-[1.35rem]">
                    {title}
                </h2>
                <p className="mt-3 max-w-sm text-sm font-mono leading-relaxed text-[var(--muted-foreground)]">
                    {description}
                </p>
            </div>
        </div>
    );
}
