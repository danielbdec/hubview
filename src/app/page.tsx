"use client";

import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Typography, Empty } from "antd";
import { Plus } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import ProjectCard from '@/components/board/ProjectCard';
import CreateProjectModal from '@/components/board/CreateProjectModal';

const { Title } = Typography;

export default function Home() {
  const projects = useBoardStore((state) => state.projects);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const projectList = Object.values(projects);

  if (!mounted) return null; // Prevent hydration mismatch with persist

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <Title level={2} style={{ margin: 0 }}>Gestão à Vista</Title>
          <p className="text-gray-500">Uninova Hubview</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          size="large"
          onClick={() => setIsModalVisible(true)}
        >
          Novo Projeto
        </Button>
      </header>

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhum projeto encontrado."
          />
          <Button type="primary" onClick={() => setIsModalVisible(true)} className="mt-4">
            Criar meu primeiro projeto
          </Button>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {projectList.map((project) => (
            <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
              <ProjectCard project={project} />
            </Col>
          ))}
        </Row>
      )}

      <CreateProjectModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => setIsModalVisible(false)}
      />
    </main>
  );
}
