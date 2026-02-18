'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Floating particle component for background
function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
            x: number; y: number; vx: number; vy: number;
            size: number; opacity: number; hue: number;
        }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: 120 + Math.random() * 40, // green spectrum
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 55%, ${p.opacity})`;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[j].x - p.x;
                    const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `hsla(140, 70%, 50%, ${0.08 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
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
            style={{ opacity: 0.6 }}
        />
    );
}

// Animated hex grid background
function HexGrid() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Radial gradient overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
                }}
            />

            {/* Animated scan line */}
            <motion.div
                className="absolute left-0 right-0 h-[1px]"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)',
                }}
                animate={{ y: [0, typeof window !== 'undefined' ? window.innerHeight : 900] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Floating orbs */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.04), transparent 70%)',
                    left: '-10%',
                    top: '20%',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, 50, -30, 0],
                    y: [0, -40, 30, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05), transparent 70%)',
                    right: '-5%',
                    bottom: '10%',
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: [0, -40, 20, 0],
                    y: [0, 30, -50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}

// Hexagonal data nodes decoration
function DataNodes() {
    const nodes = [
        { x: '10%', y: '15%', delay: 0, size: 6 },
        { x: '85%', y: '25%', delay: 0.5, size: 4 },
        { x: '15%', y: '75%', delay: 1, size: 5 },
        { x: '90%', y: '70%', delay: 1.5, size: 3 },
        { x: '50%', y: '10%', delay: 2, size: 4 },
        { x: '75%', y: '85%', delay: 0.8, size: 5 },
        { x: '30%', y: '90%', delay: 1.2, size: 3 },
        { x: '5%', y: '45%', delay: 0.3, size: 4 },
    ];

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {nodes.map((node, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: node.x, top: node.y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0.2, 0.6, 0.2],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: node.delay,
                        ease: 'easeInOut',
                    }}
                >
                    <div
                        className="rounded-full border border-emerald-500/30"
                        style={{
                            width: `${node.size}px`,
                            height: `${node.size}px`,
                            boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
                        }}
                    />
                </motion.div>
            ))}
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Check if already logged in
    useEffect(() => {
        const user = localStorage.getItem('hubview_user');
        if (user) {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Falha na autenticação');
                setIsLoading(false);
                return;
            }

            // Store user in localStorage + set auth cookie for middleware
            localStorage.setItem('hubview_user', JSON.stringify(data.user));
            document.cookie = `hubview_auth=${data.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

            setIsSuccess(true);

            // Redirect after animation
            setTimeout(() => {
                router.push('/');
            }, 1200);
        } catch {
            setError('Erro de conexão. Tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
            style={{ background: '#030806' }}
        >
            {/* Animated backgrounds */}
            <FloatingParticles />
            <HexGrid />
            <DataNodes />

            {/* Main content */}
            <AnimatePresence mode="wait">
                {isSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="z-10 flex flex-col items-center gap-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center"
                                style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.1)' }}
                            >
                                <motion.svg
                                    width="40" height="40" viewBox="0 0 24 24" fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    <motion.path
                                        d="M5 13l4 4L19 7"
                                        stroke="#34d399"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                    />
                                </motion.svg>
                            </div>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-emerald-300 font-medium text-lg tracking-wide"
                        >
                            Acesso autorizado
                        </motion.p>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 200 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="z-10 w-full max-w-[440px] px-6"
                    >
                        {/* Login Card */}
                        <div
                            className="relative overflow-hidden"
                            style={{
                                background: 'rgba(10, 20, 15, 0.7)',
                                backdropFilter: 'blur(24px) saturate(150%)',
                                border: '1px solid rgba(34, 197, 94, 0.15)',
                                borderRadius: '2px',
                                boxShadow: '0 0 60px -10px rgba(34, 197, 94, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            {/* Top accent line */}
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-[2px]"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, #22c55e, #10b981, transparent)',
                                }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />

                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/50" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/50" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/50" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/50" />

                            <div className="p-10">
                                {/* Logo + Title */}
                                <motion.div
                                    className="flex flex-col items-center mb-10"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <motion.div
                                        className="relative mb-5"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15), transparent 70%)',
                                                filter: 'blur(15px)',
                                                transform: 'scale(2)',
                                            }}
                                        />
                                        <Image
                                            src="/logo-uninova.png"
                                            alt="Uninova Hub"
                                            width={72}
                                            height={72}
                                            className="relative"
                                            style={{ filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.3))' }}
                                        />
                                    </motion.div>

                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className="text-[28px] font-bold tracking-tight"
                                            style={{
                                                background: 'linear-gradient(135deg, #ffffff 0%, #d1fae5 50%, #34d399 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}
                                        >
                                            Hub
                                        </span>
                                        <span
                                            className="text-[28px] font-light tracking-widest text-emerald-400/80"
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            View
                                        </span>
                                    </div>

                                    <motion.p
                                        className="mt-2 text-[11px] tracking-[0.3em] uppercase text-emerald-500/40 font-mono"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        Gestão de Projetos
                                    </motion.p>
                                </motion.div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email Field */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/50 mb-2">
                                            Email
                                        </label>
                                        <div
                                            className="relative group"
                                            style={{
                                                border: `1px solid ${focusedField === 'email' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.1)'}`,
                                                borderRadius: '2px',
                                                transition: 'border-color 0.3s ease',
                                            }}
                                        >
                                            {focusedField === 'email' && (
                                                <motion.div
                                                    layoutId="inputGlow"
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        boxShadow: '0 0 20px -5px rgba(34, 197, 94, 0.15), inset 0 0 20px -10px rgba(34, 197, 94, 0.05)',
                                                    }}
                                                />
                                            )}
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/40">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                                    <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                                                </svg>
                                            </div>
                                            <input
                                                id="email-input"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="seu@email.com"
                                                required
                                                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white/90 placeholder:text-white/15 outline-none font-mono"
                                                autoComplete="email"
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Password Field */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/50 mb-2">
                                            Senha
                                        </label>
                                        <div
                                            className="relative group"
                                            style={{
                                                border: `1px solid ${focusedField === 'password' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.1)'}`,
                                                borderRadius: '2px',
                                                transition: 'border-color 0.3s ease',
                                            }}
                                        >
                                            {focusedField === 'password' && (
                                                <motion.div
                                                    layoutId="inputGlow"
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        boxShadow: '0 0 20px -5px rgba(34, 197, 94, 0.15), inset 0 0 20px -10px rgba(34, 197, 94, 0.05)',
                                                    }}
                                                />
                                            )}
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/40">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                                </svg>
                                            </div>
                                            <input
                                                id="password-input"
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setFocusedField('password')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="••••••••••"
                                                required
                                                className="w-full bg-transparent pl-10 pr-12 py-3 text-sm text-white/90 placeholder:text-white/15 outline-none font-mono"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/30 hover:text-emerald-400 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Error Message */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div
                                                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-mono"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        borderRadius: '2px',
                                                        color: '#fca5a5',
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="15" y1="9" x2="9" y2="15" />
                                                        <line x1="9" y1="9" x2="15" y2="15" />
                                                    </svg>
                                                    {error}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.button
                                            type="submit"
                                            disabled={isLoading}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="relative w-full py-3.5 font-mono text-sm font-semibold tracking-wider uppercase overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.8))',
                                                color: '#030806',
                                                borderRadius: '2px',
                                                border: '1px solid rgba(34, 197, 94, 0.5)',
                                                boxShadow: '0 0 30px -5px rgba(34, 197, 94, 0.3)',
                                            }}
                                        >
                                            {/* Button shimmer effect */}
                                            <motion.div
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                                }}
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                            />

                                            {isLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <motion.div
                                                        className="w-4 h-4 border-2 border-[#030806]/30 border-t-[#030806] rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                                    />
                                                    Autenticando...
                                                </div>
                                            ) : (
                                                <span className="relative z-10">Acessar Sistema</span>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </form>

                                {/* Footer */}
                                <motion.div
                                    className="mt-8 pt-5 text-center"
                                    style={{ borderTop: '1px solid rgba(34, 197, 94, 0.08)' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <p className="text-[10px] tracking-[0.15em] uppercase font-mono text-white/20">
                                        Powered by{' '}
                                        <span className="text-emerald-500/40">Uninova Hub</span>
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Version tag */}
                        <motion.p
                            className="text-center mt-4 text-[9px] font-mono text-white/10 tracking-widest"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            v1.0.0 — SECURE CONNECTION
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
