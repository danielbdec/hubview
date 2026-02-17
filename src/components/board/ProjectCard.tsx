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
        <Card
            hoverable
            onClick={() => router.push(`/project/${project.id}`)}
            className="h-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
            actions={[
                <Button type="text" icon={<FolderOpen size={16} />} key="open" onClick={() => router.push(`/project/${project.id}`)}>Abrir</Button>
            ]}
            title={
                <div className="flex justify-between items-center">
                    <span className="truncate pr-2">{project.title}</span>
                    <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
                        <Button type="text" shape="circle" icon={<MoreVertical size={16} />} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                </div>
            }
        >
            <div className="h-24 overflow-hidden">
                <Paragraph className="text-gray-500 mb-0" ellipsis={{ rows: 3 }}>
                    {project.description || 'Sem descrição.'}
                </Paragraph>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span>{project.columnIds.length} Colunas</span>
            </div>
        </Card>
    );
};

export default ProjectCard;
