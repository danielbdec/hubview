'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/kanbanStore';
import { Users, Plus, Loader2, ShieldAlert, Mail, Calendar, KeyRound, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersPage() {
    const { users, isLoadingUsers, fetchUsers, registerUser } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Operador'
    });

    // Notification State
    const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showNotification = (type: NotificationType, title: string, message: string) => {
        setNotification({ isOpen: true, type, title, message });
    };

    useEffect(() => {
        setMounted(true);
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateUser = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            showNotification('error', 'Campos Incompletos', 'Nome, e-mail e senha são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        try {
            await registerUser(formData);

            // Reset form
            setFormData({ name: '', email: '', password: '', role: 'Operador' });
            setIsCreateModalOpen(false);
            showNotification('success', 'Usuário Criado', `"${formData.name}" registrado com sucesso.`);
        } catch (error: any) {
            showNotification('error', 'Erro no Cadastro', error?.message || 'Não foi possível cadastrar o usuário. Verifique se o e-mail já existe.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    const roleBadge = (role?: string) => {
        const r = role?.toLowerCase() || 'operador';
        if (r.includes('admin')) {
            return { label: 'ADMINISTRADOR', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
        }
        if (r.includes('visualizador')) {
            return { label: 'VISUALIZADOR', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
        }
        return { label: 'OPERADOR', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    };

    return (
        <div className="container mx-auto max-w-7xl py-8">
            <NotificationToast
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification((n) => ({ ...n, isOpen: false }))}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mb-2 flex items-center gap-3">
                        <Users className="text-[var(--primary)]" size={28} />
                        Gestão de Usuários
                    </h1>
                    <p className="text-[var(--muted-foreground)] font-mono text-sm border-l-2 border-[var(--primary)] pl-3 ml-1">
                        Gerencie acessos, papéis e visualize a equipe registrada na plataforma.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} disabled={isLoadingUsers}>
                        <Plus size={18} className="mr-2" /> Novo Usuário
                    </Button>
                </div>
            </div>

            {/* Users List */}
            {isLoadingUsers ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                    <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando usuários...</p>
                </div>
            ) : users.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--card-border)] rounded-lg bg-[var(--card)]/30"
                >
                    <div className="p-4 bg-[var(--card-hover)] rounded-full mb-4 ring-1 ring-[var(--primary)]/20">
                        <Users size={40} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                        Nenhum Usuário Encontrado
                    </h3>
                    <p className="text-[var(--muted-foreground)] max-w-md text-center mb-8 font-mono text-sm">
                        O sistema não detectou registros na base de dados (n8n). Clique em "Novo Usuário" para registrar a equipe.
                    </p>
                    <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} className="mr-2" /> Cadastrar Primeiro Usuário
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {users.map((user) => {
                            const badge = roleBadge(user.role);
                            return (
                                <motion.div
                                    key={user.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--card-hover)] p-6 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)] flex flex-col backdrop-blur-sm"
                                >
                                    {/* Tech corner accents */}
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />

                                    {/* Header */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="h-12 w-12 rounded-none bg-[var(--card-hover)] border border-[var(--card-border)] flex items-center justify-center shrink-0">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-[var(--primary)]">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight group-hover:text-[var(--primary)] transition-colors truncate">
                                                {user.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-1 text-[var(--muted-foreground)]">
                                                <Mail size={12} />
                                                <span className="text-xs font-mono truncate">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mt-auto space-y-3 pt-4 border-t border-[var(--card-border)]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase flex items-center gap-1.5">
                                                <ShieldAlert size={12} /> Nível de Acesso
                                            </span>
                                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider border px-1.5 py-0.5 ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase flex items-center gap-1.5">
                                                <Calendar size={12} /> Criado em
                                            </span>
                                            <span className="text-xs font-mono text-[var(--foreground)]">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--sidebar)] border border-[var(--primary)] w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 right-0 w-16 h-1 border-t-2 border-[var(--primary)]" />

                        <h2 className="text-2xl font-black text-[var(--foreground)] mb-6 uppercase tracking-wider flex items-center gap-2">
                            <span className="text-[var(--primary)]">_</span>Novo Usuário
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5">
                                    <UserIcon size={12} /> NOME COMPLETO
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                    placeholder="Ex: Ana Silva"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5">
                                    <Mail size={12} /> E-MAIL CORPORATIVO
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                    placeholder="Ex: ana.silva@empresa.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5">
                                    <KeyRound size={12} /> SENHA INICIAL
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50 font-mono tracking-widest"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5">
                                    <ShieldAlert size={12} /> PAPEL / PERMISSÃO
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Administrador">Administrador</option>
                                    <option value="Operador">Operador (Padrão)</option>
                                    <option value="Visualizador">Visualizador</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--card-border)]">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleCreateUser} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                {isSubmitting ? 'Registrando...' : 'Criar Conta'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
