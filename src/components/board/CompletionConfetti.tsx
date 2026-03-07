'use client';

import { CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

export type CompletionBurst = {
    id: string;
    originX: number;
    originY: number;
    accent: string;
};

type CompletionConfettiProps = {
    burst: CompletionBurst | null;
};

type ConfettiOrigin = {
    x: number;
    y: number;
};

type ConfettiOptions = {
    angle?: number;
    colors?: string[];
    decay?: number;
    disableForReducedMotion?: boolean;
    drift?: number;
    gravity?: number;
    origin?: ConfettiOrigin;
    particleCount?: number;
    scalar?: number;
    shapes?: Array<'square' | 'circle'>;
    spread?: number;
    startVelocity?: number;
    ticks?: number;
    zIndex?: number;
};

type ConfettiInstance = ((options?: ConfettiOptions) => Promise<unknown> | null) & {
    reset: () => void;
};

type ConfettiFactory = {
    create: (
        canvas: HTMLCanvasElement,
        options?: {
            disableForReducedMotion?: boolean;
            resize?: boolean;
            useWorker?: boolean;
        }
    ) => ConfettiInstance;
};

const BURST_DURATION_MS = 4200;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function hexToRgba(hex: string, alpha: number) {
    const normalized = hex.replace('#', '').trim();

    if (normalized.length !== 6) {
        return `rgba(16, 185, 129, ${alpha})`;
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildPalette(accent: string) {
    return [accent, '#A9EF2F', '#22D3EE', '#FACC15', '#F97316', '#FFFFFF'];
}

export function CompletionConfetti({ burst }: CompletionConfettiProps) {
    const shouldReduceMotion = useReducedMotion();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const confettiRef = useRef<ConfettiInstance | null>(null);
    const timeoutIdsRef = useRef<number[]>([]);

    useEffect(() => {
        return () => {
            timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            timeoutIdsRef.current = [];
            confettiRef.current?.reset();
            confettiRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!burst || shouldReduceMotion || typeof window === 'undefined' || !canvasRef.current) {
            return;
        }

        let cancelled = false;

        timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeoutIdsRef.current = [];
        confettiRef.current?.reset();
        confettiRef.current = null;

        const runCelebration = async () => {
            const imported = await import('canvas-confetti');
            if (cancelled || !canvasRef.current) return;

            const factory = (imported.default ?? imported) as unknown as ConfettiFactory;
            const confetti = factory.create(canvasRef.current, {
                resize: true,
                useWorker: true,
                disableForReducedMotion: true,
            });

            confettiRef.current = confetti;

            const origin = {
                x: clamp(burst.originX / window.innerWidth, 0.1, 0.9),
                y: clamp(burst.originY / window.innerHeight, 0.08, 0.82),
            };
            const colors = buildPalette(burst.accent);

            const fire = (options: ConfettiOptions) => {
                confetti({
                    colors,
                    disableForReducedMotion: true,
                    zIndex: 130,
                    ...options,
                });
            };

            const schedule = (delay: number, options: ConfettiOptions) => {
                const timeoutId = window.setTimeout(() => {
                    if (!cancelled) {
                        fire(options);
                    }
                }, delay);

                timeoutIdsRef.current.push(timeoutId);
            };

            fire({
                origin,
                particleCount: 120,
                spread: 78,
                startVelocity: 60,
                gravity: 1.08,
                decay: 0.93,
                scalar: 1.1,
                ticks: 240,
                shapes: ['square', 'circle'],
            });

            schedule(35, {
                origin: { x: clamp(origin.x - 0.045, 0.06, 0.94), y: clamp(origin.y + 0.01, 0.05, 0.86) },
                angle: 62,
                spread: 42,
                particleCount: 90,
                startVelocity: 64,
                gravity: 1.04,
                decay: 0.92,
                scalar: 1.08,
                ticks: 250,
                drift: -0.15,
                shapes: ['square', 'circle'],
            });

            schedule(70, {
                origin: { x: clamp(origin.x + 0.045, 0.06, 0.94), y: clamp(origin.y + 0.01, 0.05, 0.86) },
                angle: 118,
                spread: 42,
                particleCount: 90,
                startVelocity: 64,
                gravity: 1.04,
                decay: 0.92,
                scalar: 1.08,
                ticks: 250,
                drift: 0.15,
                shapes: ['square', 'circle'],
            });

            schedule(180, {
                origin,
                particleCount: 75,
                spread: 110,
                startVelocity: 48,
                gravity: 1.18,
                decay: 0.92,
                scalar: 0.96,
                ticks: 260,
                shapes: ['square', 'circle'],
            });

            Array.from({ length: 6 }, (_, index) => {
                schedule(260 + index * 150, {
                    origin: {
                        x: clamp(origin.x + (index - 2.5) * 0.035, 0.08, 0.92),
                        y: clamp(origin.y - 0.12, 0.02, 0.7),
                    },
                    particleCount: 28,
                    spread: 50,
                    startVelocity: 28,
                    gravity: 1.3,
                    decay: 0.94,
                    scalar: 0.9,
                    ticks: 300,
                    drift: (index - 2.5) * 0.08,
                    shapes: ['square', 'circle'],
                });
            });
        };

        runCelebration();

        return () => {
            cancelled = true;
            timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            timeoutIdsRef.current = [];
            confettiRef.current?.reset();
            confettiRef.current = null;
        };
    }, [burst, shouldReduceMotion]);

    if (!burst || shouldReduceMotion || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <motion.div
            key={burst.id}
            className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: BURST_DURATION_MS / 1000, ease: 'easeOut', times: [0, 0.06, 0.88, 1] }}
        >
            <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{
                    left: burst.originX,
                    top: burst.originY,
                    width: 340,
                    height: 340,
                    background: `radial-gradient(circle, ${hexToRgba(burst.accent, 0.42)} 0%, ${hexToRgba(burst.accent, 0.22)} 24%, transparent 72%)`,
                }}
                initial={{ opacity: 0, scale: 0.18 }}
                animate={{ opacity: [0, 0.95, 0.28, 0], scale: [0.18, 1.1, 1.45, 1.72] }}
                transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.div
                className="absolute -translate-x-1/2 rounded-full border"
                style={{
                    left: burst.originX,
                    top: burst.originY,
                    width: 22,
                    height: 22,
                    borderColor: hexToRgba(burst.accent, 0.46),
                    boxShadow: `0 0 24px ${hexToRgba(burst.accent, 0.55)}`,
                }}
                initial={{ opacity: 0, scale: 0.25 }}
                animate={{ opacity: [0, 1, 0], scale: [0.25, 6.2, 8.2] }}
                transition={{ duration: 0.78, ease: 'easeOut' }}
            />

            <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    left: burst.originX,
                    top: burst.originY - 32,
                    backgroundColor: 'rgba(5, 5, 5, 0.78)',
                    border: `1px solid ${hexToRgba(burst.accent, 0.48)}`,
                    boxShadow: `0 0 0 1px ${hexToRgba('#FFFFFF', 0.08)} inset, 0 18px 60px rgba(0,0,0,0.35), 0 0 26px ${hexToRgba(burst.accent, 0.24)}`,
                }}
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: [0, 1, 1, 0], y: [12, -6, -14, -24], scale: [0.92, 1, 1, 0.98] }}
                transition={{ duration: 1.55, ease: 'easeOut', times: [0, 0.18, 0.72, 1] }}
            >
                <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-white">
                    <CheckCircle2 size={14} style={{ color: burst.accent }} />
                    Tarefa concluida
                </div>
            </motion.div>

            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </motion.div>,
        document.body
    );
}
