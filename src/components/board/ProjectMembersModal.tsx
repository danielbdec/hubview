'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProjectStore, ProjectMember, ProjectRole } from '@/store/kanbanStore';
import {
    Users, X, Plus, Crown, Pencil, Eye, UserMinus,
    Globe, Lock, ChevronDown, Search, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';

interface ProjectMembersModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

const ROLE_CONFIG: Record<ProjectRole, { label: string; icon: typeof Crown; color: string; bg: string; border: string; description: string }> = {
    owner: {
        label: 'OWNER',
        icon: Crown,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        description: 'Controle total. Gerencia membros e visibilidade.',
    },
    editor: {
        label: 'EDITOR',
        icon: Pencil,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        description: 'Pode criar, editar e mover tarefas.',
    },
    viewer: {
        label: 'VIEWER',
        icon: Eye,
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        description: 'Apenas visualização. Sem edição.',
    },
};

export function ProjectMembersModal({ projectId, isOpen, onClose }: ProjectMembersModalProps) {
    const {
        projects,
        users,
        currentUser,
        fetchUsers,
        fetchProjectMembers,
        addProjectMember,
        removeProjectMember,
        updateMemberRole,
        updateProjectVisibility,
        canManageMembers,
        initializeUser,
    } = useProjectStore();

    const project = projects.find(p => p.id === projectId);
    const members = project?.members || [];
    const visibility = project?.visibility || 'public';

    // Compute isOwner reactively — depends on currentUser being subscribed
    const isOwner = useMemo(() => {
        if (!currentUser) return false;
        return canManageMembers(projectId);
    }, [currentUser, projectId, canManageMembers, projects]);

    const [isAddingMember, setIsAddingMember] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState<ProjectRole>('editor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Notification state
    const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
        isOpen: false, type: 'success', title: '', message: '',
    });
    const showNotification = (type: NotificationType, title: string, message: string) => {
        setNotification({ isOpen: true, type, title, message });
    };

    // Fetch data when opening
    useEffect(() => {
        if (isOpen && projectId) {
            // Ensure user is initialized from localStorage
            if (!currentUser) {
                initializeUser();
            }
            fetchProjectMembers(projectId);
            fetchUsers();
        }
    }, [isOpen, projectId, currentUser, initializeUser, fetchProjectMembers, fetchUsers]);

    // Users not yet added as members
    const availableUsers = useMemo(() => {
        const memberUserIds = new Set(members.map(m => m.userId));
        return users
            .filter(u => u.isActive !== false && !memberUserIds.has(u.id))
            .filter(u => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            });
    }, [users, members, searchQuery]);

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        setIsSubmitting(true);
        try {
            await addProjectMember(projectId, selectedUserId, selectedRole);
            const user = users.find(u => u.id === selectedUserId);
            showNotification('success', 'Membro Adicionado', `${user?.name || 'Usuário'} agora é ${ROLE_CONFIG[selectedRole].label} do projeto.`);
            setSelectedUserId('');
            setSelectedRole('editor');
            setIsAddingMember(false);
        } catch {
            showNotification('error', 'Erro', 'Não foi possível adicionar o membro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (member: ProjectMember) => {
        if (member.role === 'owner') {
            const ownerCount = members.filter(m => m.role === 'owner').length;
            if (ownerCount <= 1) {
                showNotification('error', 'Ação Bloqueada', 'Não é possível remover o único Owner do projeto.');
                return;
            }
        }
        setRemovingMemberId(member.userId);
        try {
            await removeProjectMember(projectId, member.userId);
            showNotification('success', 'Membro Removido', `${member.name} foi removido do projeto.`);
        } catch {
            showNotification('error', 'Erro', 'Não foi possível remover o membro.');
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleRoleChange = async (member: ProjectMember, newRole: ProjectRole) => {
        if (member.role === newRole) return;
        try {
            await updateMemberRole(projectId, member.userId, newRole);
            showNotification('success', 'Role Atualizado', `${member.name} agora é ${ROLE_CONFIG[newRole].label}.`);
        } catch {
            showNotification('error', 'Erro', 'Não foi possível atualizar o role.');
        }
    };

    const handleVisibilityToggle = async () => {
        const next = visibility === 'public' ? 'private' : 'public';
        try {
            await updateProjectVisibility(projectId, next);
            showNotification('success', 'Visibilidade Atualizada', next === 'private'
                ? 'Projeto agora é privado. Apenas membros podem ver.'
                : 'Projeto agora é público. Todos os usuários podem ver.'
            );
        } catch {
            showNotification('error', 'Erro', 'Não foi possível alterar a visibilidade.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <NotificationToast
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification(n => ({ ...n, isOpen: false }))}
            />

            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-bg)] p-4 backdrop-blur-sm animate-in fade-in"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-lg border border-[var(--card-border)] bg-[var(--sidebar)] shadow-[var(--surface-shadow)] max-h-[85vh] flex flex-col"
                >
                    {/* Accent Line */}
                    <div className="absolute top-0 right-0 w-20 h-1 border-t-2 border-[var(--primary)]" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                                <Users size={20} className="text-[var(--primary)]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-wider">
                                    Membros
                                </h2>
                                <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">
                                    {project?.title || 'Projeto'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Visibility Toggle */}
                    {isOwner && (
                        <div className="px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--card)]/30">
                            <div className="flex items-center gap-2.5">
                                {visibility === 'public' ? (
                                    <Globe size={15} className="text-emerald-400" />
                                ) : (
                                    <Lock size={15} className="text-amber-400" />
                                )}
                                <div>
                                    <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide">
                                        {visibility === 'public' ? 'Público' : 'Privado'}
                                    </span>
                                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">
                                        {visibility === 'public'
                                            ? 'Todos os usuários podem ver este projeto'
                                            : 'Apenas membros têm acesso'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleVisibilityToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                    visibility === 'private'
                                        ? 'bg-amber-500'
                                        : 'bg-[var(--card-hover)] border border-[var(--card-border)]'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                        visibility === 'private' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {/* Stats */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                                {members.length} {members.length === 1 ? 'membro' : 'membros'}
                            </span>
                            {isOwner && (
                                <button
                                    onClick={() => setIsAddingMember(true)}
                                    className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider hover:underline cursor-pointer"
                                >
                                    <Plus size={12} /> Adicionar
                                </button>
                            )}
                        </div>

                        {/* Add Member Section */}
                        <AnimatePresence>
                            {isAddingMember && isOwner && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-4"
                                >
                                    <div className="p-4 border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-3">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Buscar usuário por nome ou email..."
                                                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none placeholder:text-[var(--muted-foreground)]/50 font-mono"
                                            />
                                        </div>

                                        <select
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] p-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none font-mono"
                                        >
                                            <option value="">Selecione um usuário...</option>
                                            {availableUsers.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider shrink-0 flex items-center gap-1">
                                                <ShieldCheck size={12} /> Role:
                                            </label>
                                            <div className="flex gap-1 flex-1">
                                                {(['editor', 'viewer', 'owner'] as ProjectRole[]).map(role => {
                                                    const cfg = ROLE_CONFIG[role];
                                                    return (
                                                        <button
                                                            key={role}
                                                            onClick={() => setSelectedRole(role)}
                                                            className={`flex-1 py-1.5 px-2 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                                                selectedRole === role
                                                                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                                                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                                                            }`}
                                                        >
                                                            {cfg.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                                            <button
                                                onClick={() => { setIsAddingMember(false); setSelectedUserId(''); setSearchQuery(''); }}
                                                className="px-3 py-1.5 text-[10px] font-mono font-bold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddMember}
                                                disabled={!selectedUserId || isSubmitting}
                                                className="px-4 py-1.5 text-[10px] font-mono font-bold text-black uppercase tracking-wider bg-[var(--primary)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Members */}
                        <div className="space-y-1">
                            <AnimatePresence>
                                {members.map((member) => {
                                    const cfg = ROLE_CONFIG[member.role];
                                    const RoleIcon = cfg.icon;
                                    const isRemoving = removingMemberId === member.userId;

                                    return (
                                        <motion.div
                                            key={member.userId}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={`group flex items-center gap-3 p-3 border border-transparent hover:border-[var(--card-border)] hover:bg-[var(--card-hover)] transition-all ${
                                                isRemoving ? 'opacity-50' : ''
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className="h-9 w-9 rounded-full border border-[var(--card-border)] bg-[var(--card)] flex items-center justify-center shrink-0 overflow-hidden">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-[var(--primary)]">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--foreground)] truncate">
                                                    {member.name}
                                                </p>
                                                <p className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">
                                                    {member.email}
                                                </p>
                                            </div>

                                            {/* Role Badge */}
                                            {isOwner && member.role !== 'owner' ? (
                                                <div className="relative group/role">
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                                                        className={`appearance-none cursor-pointer text-[9px] font-mono font-bold uppercase tracking-wider border px-2 py-1 pr-5 ${cfg.bg} ${cfg.color} ${cfg.border} bg-transparent focus:outline-none`}
                                                    >
                                                        <option value="editor">EDITOR</option>
                                                        <option value="viewer">VIEWER</option>
                                                        <option value="owner">OWNER</option>
                                                    </select>
                                                    <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${cfg.color}`} />
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider border px-2 py-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                    <RoleIcon size={10} />
                                                    {cfg.label}
                                                </span>
                                            )}

                                            {/* Remove Button */}
                                            {isOwner && member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    disabled={isRemoving}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                    title="Remover membro"
                                                >
                                                    <UserMinus size={14} />
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {members.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-3 bg-[var(--card-hover)] rounded-full mb-4">
                                    <Users size={28} className="text-[var(--muted-foreground)]" />
                                </div>
                                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                                    Nenhum Membro
                                </h3>
                                <p className="text-[11px] font-mono text-[var(--muted-foreground)] max-w-xs">
                                    {visibility === 'public'
                                        ? 'Projeto público — todos têm acesso. Adicione membros para controle de roles.'
                                        : 'Adicione membros para permitir acesso ao projeto.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-[var(--card-border)] flex items-center justify-between">
                        <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                            RBAC · {visibility === 'public' ? '🌐 Público' : '🔒 Privado'}
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-[10px] font-mono font-bold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
