'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/kanbanStore';
import { Users, Plus, Loader2, ShieldAlert, Mail, Calendar, KeyRound, User as UserIcon, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'active' | 'inactive';

export default function UsersPage() {
    const { users, isLoadingUsers, fetchUsers, registerUser, deactivateUser } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('active');

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Deactivation State
    const [deactivatingUser, setDeactivatingUser] = useState<{ id: string; name: string } | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);

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

    // Filter users by tab
    const activeUsers = useMemo(() => users.filter(u => u.isActive !== false), [users]);
    const inactiveUsers = useMemo(() => users.filter(u => u.isActive === false), [users]);
    const filteredUsers = activeTab === 'active' ? activeUsers : inactiveUsers;

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

    const handleDeactivateUser = async () => {
        if (!deactivatingUser) return;
        setIsDeactivating(true);
        try {
            await deactivateUser(deactivatingUser.id);
            showNotification('success', 'Usuário Desativado', `"${deactivatingUser.name}" foi desativado com sucesso.`);
            setDeactivatingUser(null);
        } catch (error: any) {
            showNotification('error', 'Erro ao Desativar', error?.message || 'Não foi possível desativar o usuário.');
        } finally {
            setIsDeactivating(false);
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

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-[var(--card-border)]">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border-b-2 cursor-pointer ${activeTab === 'active'
                            ? 'text-emerald-400 border-emerald-400'
                            : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--card-border)]'
                        }`}
                >
                    <UserCheck size={14} />
                    Ativos
                    <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${activeTab === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-[var(--card-hover)] text-[var(--muted-foreground)]'
                        }`}>
                        {activeUsers.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border-b-2 cursor-pointer ${activeTab === 'inactive'
                            ? 'text-rose-400 border-rose-400'
                            : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--card-border)]'
                        }`}
                >
                    <UserX size={14} />
                    Inativos
                    <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${activeTab === 'inactive'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-[var(--card-hover)] text-[var(--muted-foreground)]'
                        }`}>
                        {inactiveUsers.length}
                    </span>
                </button>
            </div>

            {/* Users List */}
            {isLoadingUsers ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin text-[var(--primary)] mb-4" size={48} />
                    <p className="text-[var(--muted-foreground)] font-mono text-sm animate-pulse">Carregando usuários...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--card-border)] rounded-lg bg-[var(--card)]/30"
                >
                    <div className="p-4 bg-[var(--card-hover)] rounded-full mb-4 ring-1 ring-[var(--primary)]/20">
                        {activeTab === 'active' ? (
                            <Users size={40} className="text-[var(--primary)]" />
                        ) : (
                            <UserX size={40} className="text-rose-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                        {activeTab === 'active' ? 'Nenhum Usuário Encontrado' : 'Nenhum Usuário Inativo'}
                    </h3>
                    <p className="text-[var(--muted-foreground)] max-w-md text-center mb-8 font-mono text-sm">
                        {activeTab === 'active'
                            ? 'O sistema não detectou registros na base de dados (n8n). Clique em "Novo Usuário" para registrar a equipe.'
                            : 'Todos os usuários estão ativos no momento. Usuários desativados aparecerão aqui.'}
                    </p>
                    {activeTab === 'active' && (
                        <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={18} className="mr-2" /> Cadastrar Primeiro Usuário
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredUsers.map((user) => {
                            const badge = roleBadge(user.role);
                            const isInactive = user.isActive === false;
                            return (
                                <motion.div
                                    key={user.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className={`group relative bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--card-hover)] p-6 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)] flex flex-col backdrop-blur-sm ${isInactive ? 'opacity-60' : ''}`}
                                >
                                    {/* Tech corner accents */}
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--card-border)] group-hover:border-[var(--primary)] transition-colors" />

                                    {/* Inactive badge */}
                                    {isInactive && (
                                        <div className="absolute top-3 right-3 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5">
                                            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider">Inativo</span>
                                        </div>
                                    )}

                                    {/* Header */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`h-12 w-12 rounded-none bg-[var(--card-hover)] border border-[var(--card-border)] flex items-center justify-center shrink-0 ${isInactive ? 'grayscale' : ''}`}>
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className={`text-lg font-bold ${isInactive ? 'text-[var(--muted-foreground)]' : 'text-[var(--primary)]'}`}>
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

                                    {/* Deactivate Button — only for active users */}
                                    {!isInactive && (
                                        <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                                            <button
                                                onClick={() => setDeactivatingUser({ id: user.id, name: user.name })}
                                                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400/70 hover:text-rose-300 border border-transparent hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-200 cursor-pointer"
                                            >
                                                <UserX size={13} />
                                                Desativar Acesso
                                            </button>
                                        </div>
                                    )}
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

            {/* Deactivation Confirmation Modal */}
            {deactivatingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--sidebar)] border border-rose-500/50 w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 right-0 w-16 h-1 border-t-2 border-rose-500" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-500/10 border border-rose-500/30">
                                <UserX size={22} className="text-rose-400" />
                            </div>
                            <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-wider">
                                Desativar Usuário
                            </h2>
                        </div>

                        <p className="text-sm text-[var(--muted-foreground)] font-mono mb-2">
                            Tem certeza que deseja desativar o acesso de:
                        </p>
                        <p className="text-base font-bold text-[var(--foreground)] mb-6 pl-3 border-l-2 border-rose-500">
                            {deactivatingUser.name}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] font-mono mb-6">
                            O usuário perderá o acesso à plataforma. Esta ação pode ser revertida posteriormente.
                        </p>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                            <Button variant="ghost" onClick={() => setDeactivatingUser(null)} disabled={isDeactivating}>
                                Cancelar
                            </Button>
                            <Button variant="danger" onClick={handleDeactivateUser} disabled={isDeactivating}>
                                {isDeactivating ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserX size={16} className="mr-2" />}
                                {isDeactivating ? 'Desativando...' : 'Confirmar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
