
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { projectService } from '../../services/projectService';
import { Project } from '../../types/project';
import KanbanBoard from '../KanbanBoard';
import ProjectModal from './ProjectModal';

interface ProjectKanbanProps {
  agencyId?: string;
}

const ProjectKanban = ({ agencyId }: ProjectKanbanProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [agencyId]);

  const loadProjects = async () => {
    if (!agencyId) return;
    
    try {
      const projectsData = await projectService.getCompanyProjects(agencyId);
      setProjects(projectsData);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectMove = async (projectId: string, newStatus: "filmado" | "edicao" | "revisao" | "entregue") => {
    try {
      await projectService.updateProject(projectId, { status: newStatus });
      await loadProjects();
    } catch (error) {
      console.error('Erro ao mover projeto:', error);
    }
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!agencyId) return;
    
    try {
      await projectService.createProject({
        ...projectData,
        agencyId,
        status: 'filmado'
      });
      await loadProjects();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kanban de Projetos</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <KanbanBoard 
        projects={projects}
        onProjectMove={handleProjectMove}
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddProject}
        agencyId={agencyId}
      />
    </div>
  );
};

export default ProjectKanban;
