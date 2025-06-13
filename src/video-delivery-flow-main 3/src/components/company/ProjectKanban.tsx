
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, User, Plus } from "lucide-react";
import { Project } from "@/types/project";
import { projectService } from "@/services/projectService";
import { useToast } from "@/hooks/use-toast";
import ProjectModal from "./ProjectModal";
import ProjectDetailsModal from "./ProjectDetailsModal";

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  projects: Project[];
}

interface ProjectKanbanProps {
  companyId: string;
}

const ProjectKanban = ({ companyId }: ProjectKanbanProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [addToColumn, setAddToColumn] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (!companyId) return;

    const loadProjects = async () => {
      try {
        const companyProjects = await projectService.getCompanyProjects(companyId);
        setProjects(companyProjects);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os projetos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // Listener em tempo real
    const unsubscribe = projectService.subscribeToCompanyProjects(companyId, (updatedProjects) => {
      setProjects(updatedProjects);
    });

    return () => unsubscribe();
  }, [companyId, toast]);

  const columns: KanbanColumn[] = [
    {
      id: "filmado",
      title: "Filmado",
      color: "bg-blue-500",
      projects: projects.filter(p => p.status === "filmado")
    },
    {
      id: "edicao",
      title: "Em Edição",
      color: "bg-orange-500",
      projects: projects.filter(p => p.status === "edicao")
    },
    {
      id: "revisao",
      title: "Revisão",
      color: "bg-amber-500",
      projects: projects.filter(p => p.status === "revisao")
    },
    {
      id: "entregue",
      title: "Entregue",
      color: "bg-green-500",
      projects: projects.filter(p => p.status === "entregue")
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500";
      case "media": return "bg-yellow-500";
      case "baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedProject) return;

    try {
      await projectService.updateProject(draggedProject.id, {
        status: targetColumnId as Project['status']
      });
      
      toast({
        title: "Sucesso",
        description: "Status do projeto atualizado"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
    
    setDraggedProject(null);
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await projectService.createProject({
        ...projectData,
        status: addToColumn as Project['status'],
        companyId
      });
      
      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso"
      });
      
      setIsProjectModalOpen(false);
      setAddToColumn("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o projeto",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = async (updatedProject: Project) => {
    try {
      await projectService.updateProject(updatedProject.id, updatedProject);
      
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso"
      });
      
      setIsDetailsModalOpen(false);
      setSelectedProject(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive"
      });
    }
  };

  const openAddProjectModal = (columnId: string) => {
    setAddToColumn(columnId);
    setIsProjectModalOpen(true);
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando projetos...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline de Projetos</h2>
        <p className="text-gray-600">Gerencie seus projetos audiovisuais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className="space-y-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${column.color}`}></div>
              <h3 className="font-semibold text-lg text-gray-900">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {column.projects.length}
              </Badge>
            </div>

            {/* Project Cards */}
            <div className="space-y-3">
              {column.projects.map((project) => {
                const daysUntilDue = getDaysUntilDue(project.dueDate);
                const isOverdue = daysUntilDue < 0;
                const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;

                return (
                  <Card 
                    key={project.id} 
                    className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500 cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, project)}
                    onClick={() => openProjectDetails(project)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {project.title}
                        </CardTitle>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)} flex-shrink-0 mt-1`}></div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      {/* Client */}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{project.client}</span>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className={`${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'}`}>
                          {formatDate(project.dueDate)}
                        </span>
                        {(isOverdue || isUrgent) && (
                          <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`} />
                        )}
                      </div>

                      {/* Days Until Due */}
                      <div className="text-xs">
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-xs">
                            {Math.abs(daysUntilDue)} dias atrasado
                          </Badge>
                        ) : isUrgent ? (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                            {daysUntilDue} dias restantes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {daysUntilDue} dias restantes
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Links */}
                      {project.links && project.links.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600">Links:</p>
                          {project.links.map((link, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs h-7"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a href={link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 mr-2" />
                                Link {index + 1}
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Add Project Button */}
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-600 hover:text-orange-600"
              onClick={() => openAddProjectModal(column.id)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Projeto
            </Button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setAddToColumn("");
        }}
        onSave={handleAddProject}
      />

      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSave={handleEditProject}
      />
    </div>
  );
};

export default ProjectKanban;
