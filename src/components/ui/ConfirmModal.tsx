'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmModalProps) {
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => confirmBtnRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isLoading, onCancel]);

    const isDanger = variant === 'danger';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={!isLoading ? onCancel : undefined}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 10 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="relative w-full max-w-sm bg-[var(--sidebar)] border border-[var(--card-border)] shadow-2xl shadow-black/50"
                    >
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="absolute top-3 right-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                        >
                            <X size={16} />
                        </button>

                        {/* Corner accents */}
                        <div className={`absolute top-0 left-0 w-8 h-[2px] ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <div className={`absolute top-0 left-0 w-[2px] h-8 ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <div className={`absolute bottom-0 right-0 w-8 h-[2px] ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <div className={`absolute bottom-0 right-0 w-[2px] h-8 ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`} />

                        <div className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className={`p-3 rounded-full ring-1 ${isDanger ? 'bg-rose-500/10 ring-rose-500/30' : 'bg-amber-500/10 ring-amber-500/30'}`}>
                                    <AlertTriangle size={28} className={isDanger ? 'text-rose-400' : 'text-amber-400'} />
                                </div>
                            </div>

                            <h3 className="text-center text-lg font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                                {title}
                            </h3>

                            <p className="text-center text-sm text-[var(--muted-foreground)] font-mono leading-relaxed mb-6">
                                {message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-[var(--foreground)] bg-[var(--card-hover)] border border-[var(--card-border)] hover:bg-[var(--card)] transition-all duration-200 disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    ref={confirmBtnRef}
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-white transition-all duration-200 disabled:opacity-70 ${isDanger
                                            ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30'
                                            : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                                        }`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processando...
                                        </span>
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
