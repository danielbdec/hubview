'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    FloatingParticles,
    PerspectiveGrid,
    DecodingText,
    CinematicIntro
} from '@/components/auth/LoginEffects';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);

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
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030806] text-white selection:bg-emerald-500/30">
            {/* Cinematic Background */}
            <PerspectiveGrid />
            <FloatingParticles />

            {/* Intro Sequence Overlay */}
            {!showContent && (
                <CinematicIntro onComplete={() => setShowContent(true)} />
            )}

            {/* Main content - reveals after intro */}
            <AnimatePresence mode="wait">
                {showContent && (
                    isSuccess ? (
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
                                <div className="w-24 h-24 rounded-full border-2 border-emerald-400 flex items-center justify-center relative bg-emerald-900/20 backdrop-blur-md"
                                    style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.1)' }}
                                >
                                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
                                    <motion.svg
                                        width="48" height="48" viewBox="0 0 24 24" fill="none"
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
                            <div className="text-center">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-emerald-300 font-bold text-xl tracking-widest uppercase font-mono"
                                >
                                    <DecodingText text="PERMISSION GRANTED" />
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-emerald-500/50 text-xs tracking-[0.3em] font-mono mt-2"
                                >
                                    ESTABLISHING SESSION...
                                </motion.p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="z-10 w-full max-w-[420px] px-4"
                        >
                            {/* HUD Container */}
                            <div className="relative group perspective-1000">
                                {/* HUD Brackets */}
                                <motion.div
                                    className="absolute -inset-4 border-2 border-emerald-500/20 rounded-lg pointer-events-none"
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                >
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500" />
                                </motion.div>

                                {/* Background Glass */}
                                <div
                                    className="relative overflow-hidden p-8 md:p-10"
                                    style={{
                                        background: 'rgba(5, 20, 15, 0.85)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(16, 185, 129, 0.1)',
                                        clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' // Cut corner
                                    }}
                                >
                                    {/* Scanline */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none animate-scan" style={{ height: '50%', animation: 'scan 4s linear infinite' }} />

                                    {/* Header Section */}
                                    <div className="flex flex-col items-center mb-10 relative z-20">
                                        <motion.div
                                            className="relative mb-6"
                                            initial={{ rotateY: 90 }}
                                            animate={{ rotateY: 0 }}
                                            transition={{ duration: 0.8, delay: 0.4 }}
                                        >
                                            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full" />
                                            <Image
                                                src="/logo-uninova.png"
                                                alt="Uninova Logo"
                                                width={64}
                                                height={64}
                                                className="relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                            />
                                        </motion.div>

                                        <div className="flex items-baseline gap-1">
                                            <DecodingText
                                                text="HUB"
                                                className="text-4xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                                trigger={showContent}
                                            />
                                            <DecodingText
                                                text="VIEW"
                                                className="text-4xl font-black tracking-tighter uppercase text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                                trigger={showContent}
                                            />
                                        </div>

                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-[1px] w-8 bg-emerald-500/40" />
                                            <p className="text-[10px] tracking-tight font-bold uppercase text-emerald-500/60 font-sans">
                                                GESTÃO DE PROJETOS
                                            </p>
                                            <div className="h-[1px] w-8 bg-emerald-500/40" />
                                        </div>
                                    </div>

                                    {/* Login Form */}
                                    <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            <label className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1 block">Identity : Email</label>
                                            <div className="relative group">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    onFocus={() => setFocusedField('email')}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="ACCESS ID"
                                                    required
                                                    className="w-full bg-[#0a1510] border border-emerald-500/20 text-emerald-100 px-4 py-3 text-sm font-mono focus:border-emerald-500/60 focus:bg-[#0f221a] focus:outline-none transition-all placeholder:text-emerald-500/20"
                                                />
                                                <div className={`absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 transition-all duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`} />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 1.0 }}
                                        >
                                            <label className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1 block">Security : Verify</label>
                                            <div className="relative group">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    onFocus={() => setFocusedField('password')}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="PASSPHRASE"
                                                    required
                                                    className="w-full bg-[#0a1510] border border-emerald-500/20 text-emerald-100 px-4 py-3 text-sm font-mono focus:border-emerald-500/60 focus:bg-[#0f221a] focus:outline-none transition-all placeholder:text-emerald-500/20"
                                                />
                                                <div className={`absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 transition-all duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/30 hover:text-emerald-400 transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <span className="text-[10px] uppercase font-bold">HIDE</span>
                                                    ) : (
                                                        <span className="text-[10px] uppercase font-bold">SHOW</span>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>

                                        <AnimatePresence>
                                            {error && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-red-900/20 border border-red-500/30 p-2 text-center">
                                                        <p className="text-red-400 text-xs font-mono tracking-wide">⚠ ERROR: {error}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 1.2 }}
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-500 transition-colors py-4 clip-corner-btn"
                                            style={{
                                                clipPath: 'polygon(0 0, 100% 0, 100% 75%, 95% 100%, 0 100%)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                                            <div className="relative flex items-center justify-center gap-2">
                                                {isLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span className="text-xs font-bold tracking-[0.2em] font-mono">AUTHENTICATING...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs font-black tracking-[0.2em] font-mono">INITIALIZE UPLINK</span>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </>
                                                )}
                                            </div>
                                        </motion.button>
                                    </form>

                                    {/* Tech Decorations footer */}
                                    <div className="mt-8 flex justify-between items-end opacity-40">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-1 w-1 bg-emerald-500" />
                                            <div className="h-1 w-1 bg-emerald-500/50" />
                                            <div className="h-1 w-1 bg-emerald-500/20" />
                                        </div>
                                        <div className="text-[8px] font-mono text-emerald-500/80 text-right">
                                            SYS.VER.2.4.0<br />
                                            SECURE.ENCRYPTED
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* Global Styles for perspective */}
            <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(200%); }
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}

