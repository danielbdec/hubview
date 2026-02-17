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
    <main className="min-h-screen p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <header className="mb-12 flex justify-between items-center relative z-10 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
            Gestão à Vista
          </h1>
          <p className="text-gray-400 text-lg">Uninova Hubview</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={20} />}
          size="large"
          className="h-12 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-black border-none shadow-[0_0_20px_rgba(251,191,36,0.3)] font-semibold text-base transition-all hover:scale-105"
          onClick={() => setIsModalVisible(true)}
        >
          Novo Projeto
        </Button>
      </header>

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-32 relative z-10">
          <div className="text-gray-600 mb-6 text-6xl opacity-20">📂</div>
          <h3 className="text-2xl text-gray-300 font-bold mb-2">Seu espaço está vazio</h3>
          <p className="text-gray-500 mb-8 max-w-md text-center">Crie projetos para organizar suas tarefas, ideias e fluxos de trabalho em um só lugar.</p>
          <Button
            type="primary"
            size="large"
            onClick={() => setIsModalVisible(true)}
            className="bg-white/10 border-white/10 hover:bg-white/20 h-10"
          >
            Criar meu primeiro projeto
          </Button>
        </div>
      ) : (
        <Row gutter={[24, 24]} className="relative z-10">
          {projectList.map((project) => (
            <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={6}>
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
