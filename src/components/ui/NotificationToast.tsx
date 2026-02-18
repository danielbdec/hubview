'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning';

interface NotificationToastProps {
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    onClose: () => void;
    duration?: number;
}

const config: Record<NotificationType, { icon: typeof CheckCircle; gradient: string; border: string; glow: string }> = {
    success: {
        icon: CheckCircle,
        gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]',
    },
    error: {
        icon: XCircle,
        gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
        border: 'border-rose-500/40',
        glow: 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.4)]',
    },
    warning: {
        icon: AlertTriangle,
        gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
        border: 'border-amber-500/40',
        glow: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]',
    },
};

const iconColor: Record<NotificationType, string> = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    warning: 'text-amber-400',
};

export default function NotificationToast({
    isOpen,
    type,
    title,
    message,
    onClose,
    duration = 4000,
}: NotificationToastProps) {
    const { icon: Icon, gradient, border, glow } = config[type];

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [isOpen, duration, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`
                        fixed top-6 right-6 z-[100] 
                        min-w-[340px] max-w-[420px]
                        bg-[var(--sidebar)] ${border} border
                        ${glow}
                        backdrop-blur-xl
                    `}
                >
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient.replace('to-transparent', 'to-transparent')}`}>
                        <motion.div
                            className="h-full bg-current"
                            style={{ color: type === 'success' ? '#10b981' : type === 'error' ? '#f43f5e' : '#f59e0b' }}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: duration / 1000, ease: 'linear' }}
                        />
                    </div>

                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

                    <div className="relative p-4 flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                            <Icon size={22} className={iconColor[type]} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">{title}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed font-mono">{message}</p>
                        </div>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
