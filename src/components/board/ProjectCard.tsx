import React from 'react';
import { Card, Typography, Button, Dropdown, MenuProps } from 'antd';
import { MoreVertical, Trash2, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBoardStore, Project } from '@/store/boardStore';

const { Title, Paragraph } = Typography;

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const router = useRouter();
    const deleteProject = useBoardStore((state) => state.deleteProject);

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        e.domEvent.stopPropagation();
        if (e.key === 'delete') {
            deleteProject(project.id);
        }
    };

    const items: MenuProps['items'] = [
        {
            label: 'Excluir Projeto',
            key: 'delete',
            icon: <Trash2 size={14} />,
            danger: true,
        },
    ];

    return (
        <div
            onClick={() => router.push(`/project/${project.id}`)}
            className="premium-card h-full rounded-2xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
            {/* Spotlight Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors truncate pr-2 tracking-tight">
                        {project.title}
                    </h3>
                    <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 active:scale-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical size={18} />
                        </button>
                    </Dropdown>
                </div>

                <div className="h-20 overflow-hidden relative z-10 mb-4">
                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                        {project.description || 'Sem descrição.'}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="bg-white/5 px-2.5 py-1 rounded-md text-gray-400 font-medium">
                        {project.columnIds.length} Listas
                    </span>
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300 text-amber-400/80 group-hover:text-amber-400 font-medium flex items-center gap-1">
                    Abrir <span className="text-lg">→</span>
                </span>
            </div>
        </div>
    );
};

export default ProjectCard;
