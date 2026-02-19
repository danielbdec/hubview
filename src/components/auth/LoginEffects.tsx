'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Floating Particles with Z-depth simulation
 */
export function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
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
                const opacity = p.opacity * (1 / p.z); // Fade distant particles

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 55%, ${opacity})`;
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
                        ctx.strokeStyle = `hsla(140, 70%, 50%, ${0.05 * (1 - dist / 100)})`;
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
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
}

/**
 * 3D Perspective Grid Floor
 */
export function PerspectiveGrid() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
            style={{ perspective: '1000px' }}>

            {/* The Grid Plane */}
            <motion.div
                className="absolute inset-[-100%]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                style={{
                    transform: 'rotateX(60deg) translateY(-20%)',
                    background: 'linear-gradient(transparent 0%, rgba(16, 185, 129, 0.05) 100%)',
                    backgroundImage: `
                        linear-gradient(0deg, transparent 24%, rgba(16, 185, 129, .15) 25%, rgba(16, 185, 129, .15) 26%, transparent 27%, transparent 74%, rgba(16, 185, 129, .15) 75%, rgba(16, 185, 129, .15) 76%, transparent 77%, transparent),
                        linear-gradient(90deg, transparent 24%, rgba(16, 185, 129, .15) 25%, rgba(16, 185, 129, .15) 26%, transparent 27%, transparent 74%, rgba(16, 185, 129, .15) 75%, rgba(16, 185, 129, .15) 76%, transparent 77%, transparent)
                    `,
                    backgroundSize: '80px 80px',
                    transformOrigin: '50% 100%',
                }}
            >
                {/* Moving scanline inside the grid */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent"
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
            </motion.div>

            {/* Horizon Glow / Fog */}
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-[#030806] via-[#030806]/90 to-transparent pointer-events-none" />
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
                    <div className="w-16 h-16 border-2 border-emerald-500/50 rounded-full border-t-emerald-400 animate-spin mx-auto" />
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
