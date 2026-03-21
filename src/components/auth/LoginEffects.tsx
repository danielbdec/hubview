'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { useTheme } from '@/components/ui/ThemeProvider';

/**
 * Enhanced Floating Particles with Z-depth simulation
 */
export function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const particles: Array<{
            x: number; y: number; z: number;
            vx: number; vy: number; vz: number;
            size: number; opacity: number; hue: number;
        }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles with depth
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 2, // Depth factor
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                vz: (Math.random() - 0.5) * 0.01,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: 120 + Math.random() * 60, // Emerald to Cyan spectrum
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sort by depth for correct layering (painter's algorithm)
            particles.sort((a, b) => a.z - b.z);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                // Wrap around screen
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Depth logic
                if (p.z < 0.1) p.z = 2;
                if (p.z > 2) p.z = 0.1;

                const perspective = 1000 / (1000 - p.z * 200); // Simple perspective projection
                const size = p.size * perspective;
                const opacity = p.opacity * (1 / p.z) * (isLight ? 1.5 : 1); // Boost opacity in light mode

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, ${isLight ? 35 : 55}%, ${opacity})`;
                ctx.fill();

                // Connect nearby particles (within similar depth plane)
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    if (Math.abs(p.z - p2.z) > 0.5) continue; // Only connect if close in Z

                    const dx = p2.x - p.x;
                    const dy = p2.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100 * perspective) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `hsla(140, ${isLight ? 90 : 70}%, ${isLight ? 35 : 50}%, ${(isLight ? 0.15 : 0.05) * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5 * perspective;
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [isLight]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
}

/**
 * Orbital HUD backdrop for the login screen
 */
export function PerspectiveGrid() {
    const shouldReduceMotion = useReducedMotion();
    const ringConfigs = [
        {
            size: 900,
            duration: 34,
            opacity: 0.2,
            border: 'rgba(16, 185, 129, 0.16)',
            mask: 'radial-gradient(circle, transparent 58%, black 58.8%, black 61.8%, transparent 62.8%)',
            fill: 'repeating-conic-gradient(from 0deg, rgba(16,185,129,0.28) 0deg 9deg, transparent 9deg 24deg)',
        },
        {
            size: 680,
            duration: 24,
            opacity: 0.26,
            border: 'rgba(34, 211, 238, 0.14)',
            mask: 'radial-gradient(circle, transparent 50%, black 51%, black 54%, transparent 55%)',
            fill: 'repeating-conic-gradient(from 12deg, rgba(34,211,238,0.22) 0deg 12deg, transparent 12deg 28deg)',
        },
        {
            size: 460,
            duration: 18,
            opacity: 0.34,
            border: 'rgba(255, 255, 255, 0.12)',
            mask: 'radial-gradient(circle, transparent 44%, black 45%, black 48%, transparent 49%)',
            fill: 'repeating-conic-gradient(from 0deg, rgba(250,204,21,0.18) 0deg 7deg, transparent 7deg 22deg)',
        },
    ];

    const beamConfigs = [
        { left: '18%', width: 160, delay: 0, duration: 7.5, color: 'rgba(16,185,129,0.14)' },
        { left: '50%', width: 220, delay: 1.1, duration: 9, color: 'rgba(34,211,238,0.12)' },
        { left: '78%', width: 180, delay: 2.2, duration: 8.3, color: 'rgba(250,204,21,0.08)' },
    ];

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(18,34,28,0.78),rgba(3,8,6,0.94)_34%,#020403_72%,#010201_100%)]" />

            <motion.div
                className="absolute left-1/2 top-1/2 h-[58rem] w-[58rem] -translate-x-1/2 -translate-y-[48%] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(34,211,238,0.10) 24%, rgba(16,185,129,0.05) 42%, transparent 70%)',
                    filter: 'blur(30px)',
                }}
                animate={shouldReduceMotion ? undefined : { scale: [0.96, 1.03, 0.98], opacity: [0.5, 0.85, 0.62] }}
                transition={shouldReduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,transparent_18%,rgba(16,185,129,0.05)_34%,transparent_62%)] opacity-90" />

            {ringConfigs.map((ring, index) => (
                <motion.div
                    key={ring.size}
                    className="absolute left-1/2 top-1/2 rounded-full border"
                    style={{
                        width: ring.size,
                        height: ring.size,
                        marginLeft: -ring.size / 2,
                        marginTop: -ring.size * 0.47,
                        borderColor: ring.border,
                        background: ring.fill,
                        opacity: ring.opacity,
                        WebkitMaskImage: ring.mask,
                        maskImage: ring.mask,
                        boxShadow: index === 2 ? '0 0 40px rgba(16,185,129,0.08)' : undefined,
                    }}
                    animate={shouldReduceMotion ? undefined : { rotate: index % 2 === 0 ? 360 : -360, scale: [1, 1.02, 0.99, 1] }}
                    transition={shouldReduceMotion ? undefined : { duration: ring.duration, repeat: Infinity, ease: 'linear' }}
                />
            ))}

            <motion.div
                className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-[52%] rounded-full border border-emerald-400/25"
                style={{
                    boxShadow: '0 0 60px rgba(16,185,129,0.12), inset 0 0 40px rgba(34,211,238,0.05)',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(16,185,129,0.04) 42%, transparent 78%)',
                }}
                animate={shouldReduceMotion ? undefined : { scale: [0.96, 1.03, 0.98], rotate: [0, 10, 0] }}
                transition={shouldReduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            {beamConfigs.map((beam) => (
                <motion.div
                    key={beam.left}
                    className="absolute top-[-15%] h-[130%] -translate-x-1/2"
                    style={{
                        left: beam.left,
                        width: beam.width,
                        background: `linear-gradient(180deg, transparent 0%, ${beam.color} 22%, rgba(255,255,255,0.03) 50%, transparent 88%)`,
                        filter: 'blur(22px)',
                    }}
                    animate={shouldReduceMotion ? undefined : { opacity: [0.12, 0.42, 0.14], x: [0, 24, -18, 0], y: ['-4%', '2%', '-1%', '-4%'] }}
                    transition={shouldReduceMotion ? undefined : { duration: beam.duration, delay: beam.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            <motion.div
                className="absolute left-1/2 top-[12%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full"
                style={{
                    background: 'conic-gradient(from 180deg, transparent 0deg, rgba(16,185,129,0.18) 54deg, transparent 118deg, rgba(34,211,238,0.16) 200deg, transparent 280deg, rgba(250,204,21,0.10) 328deg, transparent 360deg)',
                    filter: 'blur(18px)',
                    opacity: 0.22,
                }}
                animate={shouldReduceMotion ? undefined : { rotate: [0, 360] }}
                transition={shouldReduceMotion ? undefined : { duration: 22, repeat: Infinity, ease: 'linear' }}
            />

            <div
                className="absolute inset-0 opacity-[0.16]"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.16) 50%, transparent 100%),
                        linear-gradient(0deg, transparent 0%, rgba(34,211,238,0.12) 50%, transparent 100%)
                    `,
                    backgroundSize: '220px 220px, 220px 220px',
                    maskImage: 'radial-gradient(circle at center, black 0%, rgba(0,0,0,0.8) 38%, transparent 78%)',
                }}
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_46%,rgba(2,4,3,0.48)_74%,rgba(1,2,1,0.92)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 via-[#020403]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-[#020403]/30 to-transparent" />
        </div>
    );
}

/**
 * Decoding Text Effect component
 */
export function DecodingText({ text, className, trigger = true }: { text: string, className?: string, trigger?: boolean }) {
    const [display, setDisplay] = useState('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

    useEffect(() => {
        if (!trigger) return;

        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(text
                .split('')
                .map((letter, index) => {
                    if (index < iteration) {
                        return text[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('')
            );

            if (iteration >= text.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3; // Slower reveal
        }, 30);

        return () => clearInterval(interval);
    }, [text, trigger]);

    return <span className={className}>{display}</span>;
}

/**
 * Full Screen Intro Sequence
 */
export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-50 bg-[#030806] flex items-center justify-center font-mono pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 2.5, ease: 'easeInOut' }}
            onAnimationComplete={onComplete}
        >
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                >
                    <div className="mx-auto flex h-28 w-28 items-center justify-center">
                        <Spinner size="lg" tone="light" />
                    </div>
                </motion.div>

                <motion.p
                    className="text-emerald-500 text-xs tracking-[0.5em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
                >
                    <DecodingText text="SISTEMA INICIALIZANDO..." />
                </motion.p>

                <motion.div
                    className="mt-2 text-[10px] text-emerald-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    ESTABELECENDO CONEXÃO SEGURA
                </motion.div>
            </div>
        </motion.div>
    );
}
