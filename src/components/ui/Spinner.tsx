import { CSSProperties, HTMLAttributes, useId } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerTone = 'primary' | 'light' | 'current';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    size?: SpinnerSize;
    tone?: SpinnerTone;
}

interface SpinnerPalette {
    trackOuter: string;
    trackInner: string;
    outerStart: string;
    outerMid: string;
    outerHighlight: string;
    outerEnd: string;
    innerStart: string;
    innerMid: string;
    innerHighlight: string;
    innerEnd: string;
    outerReflectStart: string;
    outerReflectEnd: string;
    innerReflectStart: string;
    innerReflectEnd: string;
}

const spinnerSizes: Record<SpinnerSize, number> = {
    sm: 18,
    md: 28,
    lg: 72,
    xl: 96,
};

const palettes: Record<SpinnerTone, SpinnerPalette> = {
    primary: {
        trackOuter: 'rgba(169, 239, 47, 0.18)',
        trackInner: 'rgba(169, 239, 47, 0.1)',
        outerStart: 'rgba(169, 239, 47, 0.08)',
        outerMid: '#a9ef2f',
        outerHighlight: '#fbffe8',
        outerEnd: 'rgba(169, 239, 47, 0.64)',
        innerStart: 'rgba(169, 239, 47, 0.05)',
        innerMid: '#d8ff74',
        innerHighlight: '#ffffff',
        innerEnd: 'rgba(169, 239, 47, 0.38)',
        outerReflectStart: 'rgba(255,255,255,0.72)',
        outerReflectEnd: 'rgba(233,255,182,0)',
        innerReflectStart: 'rgba(255,255,255,0.62)',
        innerReflectEnd: 'rgba(233,255,182,0)',
    },
    light: {
        trackOuter: 'rgba(233, 255, 182, 0.18)',
        trackInner: 'rgba(233, 255, 182, 0.1)',
        outerStart: 'rgba(233, 255, 182, 0.08)',
        outerMid: '#d8ff74',
        outerHighlight: '#ffffff',
        outerEnd: 'rgba(216, 255, 116, 0.58)',
        innerStart: 'rgba(233, 255, 182, 0.05)',
        innerMid: '#f0ffb0',
        innerHighlight: '#ffffff',
        innerEnd: 'rgba(216, 255, 116, 0.34)',
        outerReflectStart: 'rgba(255,255,255,0.76)',
        outerReflectEnd: 'rgba(255,255,255,0)',
        innerReflectStart: 'rgba(255,255,255,0.66)',
        innerReflectEnd: 'rgba(255,255,255,0)',
    },
    current: {
        trackOuter: 'color-mix(in srgb, currentColor 14%, transparent)',
        trackInner: 'color-mix(in srgb, currentColor 8%, transparent)',
        outerStart: 'color-mix(in srgb, currentColor 8%, transparent)',
        outerMid: 'currentColor',
        outerHighlight: '#ffffff',
        outerEnd: 'color-mix(in srgb, currentColor 55%, transparent)',
        innerStart: 'color-mix(in srgb, currentColor 4%, transparent)',
        innerMid: 'color-mix(in srgb, currentColor 80%, white 20%)',
        innerHighlight: '#ffffff',
        innerEnd: 'color-mix(in srgb, currentColor 32%, transparent)',
        outerReflectStart: 'rgba(255,255,255,0.72)',
        outerReflectEnd: 'rgba(255,255,255,0)',
        innerReflectStart: 'rgba(255,255,255,0.62)',
        innerReflectEnd: 'rgba(255,255,255,0)',
    },
};

export function Spinner({
    size = 'md',
    tone = 'primary',
    className,
    style,
    ...props
}: SpinnerProps) {
    const id = useId().replace(/:/g, '');
    const outerGradientId = `${id}-outer-gradient`;
    const innerGradientId = `${id}-inner-gradient`;
    const outerReflectId = `${id}-outer-reflect`;
    const innerReflectId = `${id}-inner-reflect`;
    const glowId = `${id}-glow`;
    const palette = palettes[tone];

    const spinnerStyle = {
        ...style,
        ['--hubview-spinner-size' as string]: `${spinnerSizes[size]}px`,
    } as CSSProperties;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'hubview-spinner',
                className
            )}
            style={spinnerStyle}
            {...props}
        >
            <span className="sr-only">Carregando</span>
            <svg
                aria-hidden="true"
                viewBox="0 0 120 120"
                className="hubview-spinner__svg"
            >
                <defs>
                    <linearGradient id={outerGradientId} x1="14%" y1="14%" x2="86%" y2="86%">
                        <stop offset="0%" stopColor={palette.outerStart} />
                        <stop offset="36%" stopColor={palette.outerMid} />
                        <stop offset="58%" stopColor={palette.outerHighlight} />
                        <stop offset="100%" stopColor={palette.outerEnd} />
                    </linearGradient>

                    <linearGradient id={innerGradientId} x1="86%" y1="12%" x2="18%" y2="88%">
                        <stop offset="0%" stopColor={palette.innerStart} />
                        <stop offset="34%" stopColor={palette.innerMid} />
                        <stop offset="56%" stopColor={palette.innerHighlight} />
                        <stop offset="100%" stopColor={palette.innerEnd} />
                    </linearGradient>

                    <linearGradient id={outerReflectId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={palette.outerReflectStart} />
                        <stop offset="100%" stopColor={palette.outerReflectEnd} />
                    </linearGradient>

                    <linearGradient id={innerReflectId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={palette.innerReflectStart} />
                        <stop offset="100%" stopColor={palette.innerReflectEnd} />
                    </linearGradient>

                    <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="3.2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <circle
                    cx="60"
                    cy="60"
                    r="41"
                    className="hubview-spinner__track"
                    stroke={palette.trackOuter}
                    strokeWidth="4.5"
                />
                <circle
                    cx="60"
                    cy="60"
                    r="29"
                    className="hubview-spinner__track hubview-spinner__track--inner"
                    stroke={palette.trackInner}
                    strokeWidth="3.5"
                />

                <circle
                    cx="60"
                    cy="60"
                    r="41"
                    fill="none"
                    stroke={`url(#${outerGradientId})`}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray="86 257.6"
                    transform="rotate(112 60 60)"
                    filter={`url(#${glowId})`}
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="112 60 60;472 60 60"
                        dur="2.1s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.84;1;0.84"
                        dur="1.1s"
                        repeatCount="indefinite"
                    />
                </circle>

                <circle
                    cx="60"
                    cy="60"
                    r="41"
                    fill="none"
                    stroke={`url(#${outerReflectId})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="36 307.6"
                    transform="rotate(126 60 60)"
                    opacity="0.86"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="126 60 60;486 60 60"
                        dur="2.1s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.4;0.95;0.4"
                        dur="1.05s"
                        repeatCount="indefinite"
                    />
                </circle>

                <circle
                    cx="60"
                    cy="60"
                    r="29"
                    fill="none"
                    stroke={`url(#${innerGradientId})`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="60 182.2"
                    transform="rotate(248 60 60)"
                    filter={`url(#${glowId})`}
                    opacity="0.92"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="248 60 60;-112 60 60"
                        dur="1.65s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.74;0.96;0.74"
                        dur="0.95s"
                        repeatCount="indefinite"
                    />
                </circle>

                <circle
                    cx="60"
                    cy="60"
                    r="29"
                    fill="none"
                    stroke={`url(#${innerReflectId})`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="24 218"
                    transform="rotate(262 60 60)"
                    opacity="0.72"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="262 60 60;-98 60 60"
                        dur="1.65s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.28;0.84;0.28"
                        dur="0.9s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
        </div>
    );
}
