'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Camera,
    Save,
    Loader2,
    CheckCircle,
    Calendar,
    Mail,
    Shield,
    AlertCircle,
    X,
    ZoomIn,
    ZoomOut,
    Move,
    Check as CheckIcon
} from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    birthDate: string | null;
}

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarBase64, setAvatarBase64] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [isCropping, setIsCropping] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const cropAreaRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const loadProfile = useCallback(async () => {
        try {
            const stored = localStorage.getItem('hubview_user');
            if (!stored) return;

            const user = JSON.parse(stored);
            const res = await fetch(`/api/user/profile?userId=${user.id}`);
            const data = await res.json();

            if (data.success && data.user) {
                const u = data.user;
                setProfile(u);
                setName(u.name || '');
                setBirthDate(u.birthDate ? u.birthDate.split('T')[0] : '');
                if (u.avatar) {
                    setAvatarPreview(u.avatar);
                    setAvatarBase64(u.avatar);
                }
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Erro ao carregar perfil');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('Imagem muito grande. Máximo 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setCropImage(result);
            setIsCropping(true);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    // Drag handlers for crop
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setOffset({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleTouchMove, handleMouseUp]);

    // Confirm crop — render to canvas
    const handleCropConfirm = () => {
        if (!cropImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, outputSize, outputSize);

            // The crop area is 200x200 in the UI, scale factor
            const uiSize = 200;
            const scaleFactor = outputSize / uiSize;

            // Calculate draw parameters matching the CSS transform
            const imgAspect = img.width / img.height;
            let drawW: number, drawH: number;

            if (imgAspect > 1) {
                drawH = uiSize * zoom;
                drawW = drawH * imgAspect;
            } else {
                drawW = uiSize * zoom;
                drawH = drawW / imgAspect;
            }

            const dx = ((uiSize - drawW) / 2 + offset.x) * scaleFactor;
            const dy = ((uiSize - drawH) / 2 + offset.y) * scaleFactor;

            // Clip to circle
            ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(img, dx, dy, drawW * scaleFactor, drawH * scaleFactor);

            const result = canvas.toDataURL('image/webp', 0.85);
            setAvatarPreview(result);
            setAvatarBase64(result);
            setIsCropping(false);
            setCropImage(null);
        };
        img.src = cropImage;
    };

    const handleCropCancel = () => {
        setIsCropping(false);
        setCropImage(null);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleSave = async () => {
        if (!profile) return;

        setIsSaving(true);
        setError('');
        setSaveSuccess(false);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    name,
                    avatar: avatarBase64,
                    birthDate: birthDate || null,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSaveSuccess(true);

                const stored = localStorage.getItem('hubview_user');
                if (stored) {
                    const user = JSON.parse(stored);
                    user.name = name;
                    user.avatar = avatarBase64;
                    user.birthDate = birthDate;
                    localStorage.setItem('hubview_user', JSON.stringify(user));
                }

                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setError(data.error || 'Erro ao salvar');
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-[var(--muted-foreground)]"
                >
                    <Loader2 className="animate-spin" size={20} />
                    <span className="font-mono text-sm">CARREGANDO PERFIL...</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Hidden canvas for crop processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Crop Modal */}
            <AnimatePresence>
                {isCropping && cropImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--card)] border border-[var(--card-border)] p-6 w-[360px] flex flex-col items-center gap-5"
                        >
                            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--foreground)]">
                                Enquadrar Foto
                            </h3>

                            <p className="text-[11px] font-mono text-[var(--muted-foreground)] flex items-center gap-1.5">
                                <Move size={12} />
                                Arraste para posicionar
                            </p>

                            {/* Crop Area */}
                            <div
                                ref={cropAreaRef}
                                className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-2 border-[var(--primary)] cursor-grab active:cursor-grabbing select-none"
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                            >
                                <img
                                    src={cropImage}
                                    alt="Crop preview"
                                    className="absolute select-none pointer-events-none"
                                    draggable={false}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                                        transformOrigin: 'center',
                                    }}
                                />
                                {/* Grid overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/15" />
                                    <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/15" />
                                    <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/15" />
                                    <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/15" />
                                </div>
                            </div>

                            {/* Zoom slider */}
                            <div className="flex items-center gap-3 w-full px-2">
                                <ZoomOut size={14} className="text-[var(--muted-foreground)] shrink-0" />
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.05"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,232,123,0.4)]"
                                />
                                <ZoomIn size={14} className="text-[var(--muted-foreground)] shrink-0" />
                            </div>
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                                ZOOM: {Math.round(zoom * 100)}%
                            </span>

                            {/* Actions */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleCropCancel}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-white/20 text-[var(--muted-foreground)] hover:text-white hover:border-white/40 font-mono text-xs uppercase tracking-wider transition-all"
                                >
                                    <X size={14} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCropConfirm}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00E87B] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00cc6a] transition-all"
                                >
                                    <CheckIcon size={14} />
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-1">
                        Configurações
                    </h1>
                    <p className="text-[var(--muted-foreground)] font-mono text-sm">
                        PERFIL_USUARIO · DADOS_PESSOAIS
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-300 font-mono text-xs uppercase tracking-wider transition-all duration-200 rounded"
                >
                    <X size={16} />
                    Fechar
                </motion.button>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative border border-[var(--card-border)] bg-[var(--card)] p-8 overflow-hidden"
            >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[var(--primary)] opacity-40" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[var(--primary)] opacity-40" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[var(--primary)] opacity-40" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[var(--primary)] opacity-40" />

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors relative">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[var(--column-bg)] flex items-center justify-center">
                                        <User size={40} className="text-[var(--muted-foreground)]" />
                                    </div>
                                )}

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>

                            {/* Glow ring */}
                            <div className="absolute -inset-1 rounded-full border border-[var(--primary)] opacity-0 group-hover:opacity-30 transition-opacity" />
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-mono text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                        >
                            ALTERAR FOTO
                        </button>
                        <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
                            PNG, JPG ou WebP · Max 2MB
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 space-y-6 w-full">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                                <User size={14} />
                                Nome
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                placeholder="Seu nome completo"
                            />
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                                <Calendar size={14} />
                                Data de Nascimento
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--primary)] transition-colors [color-scheme:dark]"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                                <Mail size={14} />
                                E-mail
                            </label>
                            <div className="w-full px-4 py-3 bg-[var(--column-bg)] border border-[var(--card-border)] text-[var(--muted-foreground)] font-mono text-sm opacity-60">
                                {profile?.email}
                            </div>
                            <p className="text-[10px] text-[var(--muted-foreground)] font-mono italic">
                                O e-mail não pode ser alterado
                            </p>
                        </div>

                        {/* Role (Read-only) */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                                <Shield size={14} />
                                Perfil de Acesso
                            </label>
                            <div className="w-full px-4 py-3 bg-[var(--column-bg)] border border-[var(--card-border)] font-mono text-sm">
                                <span className="text-[var(--primary)] uppercase font-bold">{profile?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 px-4 py-3 border border-red-500/30 bg-red-500/10 flex items-center gap-2"
                        >
                            <AlertCircle size={16} className="text-red-400" />
                            <span className="text-red-400 text-sm font-mono">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-between">
                    <div>
                        <AnimatePresence>
                            {saveSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2 text-[var(--primary)] font-mono text-sm"
                                >
                                    <CheckCircle size={16} />
                                    Perfil atualizado com sucesso!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#00E87B] text-black font-mono text-sm font-bold uppercase tracking-wider rounded disabled:opacity-50 transition-all duration-200 hover:bg-[#00cc6a] hover:shadow-[0_0_20px_rgba(0,232,123,0.3)] active:bg-[#00b35e] active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </motion.div>

            {/* Account Info Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border border-[var(--card-border)] bg-[var(--card)] p-6"
            >
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] mb-4 font-mono">
                    Informações da Conta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                    <div className="flex justify-between p-3 bg-[var(--column-bg)] border border-[var(--card-border)]">
                        <span className="text-[var(--muted-foreground)]">ID</span>
                        <span className="text-[var(--foreground)] text-xs">{profile?.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[var(--column-bg)] border border-[var(--card-border)]">
                        <span className="text-[var(--muted-foreground)]">Status</span>
                        <span className="text-[var(--primary)]">● ATIVO</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
