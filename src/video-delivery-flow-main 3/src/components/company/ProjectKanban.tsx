
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { projectService } from '../../services/projectService';
import { Project } from '../../types/project';
import KanbanBoard from '../KanbanBoard';
import ProjectModal from './ProjectModal';

interface ProjectKanbanProps {
  agencyId: string;
}

const ProjectKanban = ({ agencyId }: ProjectKanbanProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      if (agencyId) {
        try {
          const projectsData = await projectService.getCompanyProjects(agencyId);
          setProjects(projectsData);
        } catch (error) {
          console.error('Erro ao carregar projetos:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjects();
  }, [agencyId]);

  const handleProjectMove = async (projectId: string, newStatus: Project['status']) => {
    try {
      await projectService.updateProject(projectId, { status: newStatus });
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        )
      );
    } catch (error) {
      console.error('Erro ao mover projeto:', error);
    }
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const projectId = await projectService.createProject({
        ...projectData,
        agencyId,
        status: 'filmado'
      });
      
      const newProject: Project = {
        id: projectId,
        ...projectData,
        agencyId,
        status: 'filmado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProjects(prev => [newProject, ...prev]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
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
        <h2 className="text-2xl font-bold">Projetos</h2>
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
