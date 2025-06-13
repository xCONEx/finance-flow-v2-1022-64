
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, User, Plus } from "lucide-react";
import ProjectModal from "./ProjectModal";
import ProjectDetailsModal from "./ProjectDetailsModal";

interface Project {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "baixa" | "media" | "alta";
  description?: string;
  links?: string[];
  status: "filmado" | "edicao" | "revisao" | "entregue";
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  projects: Project[];
}

const KanbanBoard = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: "filmado",
      title: "Filmado",
      color: "bg-blue-500",
      projects: [
        {
          id: "1",
          title: "Vídeo Institucional - TechCorp",
          client: "TechCorp Ltda",
          dueDate: "2024-06-20",
          priority: "alta",
          description: "Vídeo institucional para lançamento de produto",
          status: "filmado"
        },
        {
          id: "2",
          title: "Casamento Sara & João",
          client: "Sara Silva",
          dueDate: "2024-06-25",
          priority: "media",
          status: "filmado"
        }
      ]
    },
    {
      id: "edicao",
      title: "Em Edição",
      color: "bg-brand-orange",
      projects: [
        {
          id: "3",
          title: "Comercial - Café Premium",
          client: "Café Premium",
          dueDate: "2024-06-18",
          priority: "alta",
          description: "Spot de 30s para TV e redes sociais",
          status: "edicao"
        }
      ]
    },
    {
      id: "revisao",
      title: "Revisão",
      color: "bg-amber-500",
      projects: [
        {
          id: "4",
          title: "Tutorial - App Mobile",
          client: "StartupXYZ",
          dueDate: "2024-06-22",
          priority: "media",
          links: ["https://wetransfer.com/example"],
          status: "revisao"
        }
      ]
    },
    {
      id: "entregue",
      title: "Entregue",
      color: "bg-green-500",
      projects: [
        {
          id: "5",
          title: "Evento Corporativo",
          client: "Empresa ABC",
          dueDate: "2024-06-15",
          priority: "baixa",
          links: ["https://drive.google.com/example", "https://wetransfer.com/example2"],
          status: "entregue"
        }
      ]
    }
  ]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [addToColumn, setAddToColumn] = useState<string>("");

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

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedProject) return;

    const sourceColumnIndex = columns.findIndex(col => 
      col.projects.some(p => p.id === draggedProject.id)
    );
    const targetColumnIndex = columns.findIndex(col => col.id === targetColumnId);

    if (sourceColumnIndex === -1 || targetColumnIndex === -1) return;

    const newColumns = [...columns];
    
    // Remove project from source column
    newColumns[sourceColumnIndex].projects = newColumns[sourceColumnIndex].projects.filter(
      p => p.id !== draggedProject.id
    );
    
    // Add project to target column with updated status
    const updatedProject = { ...draggedProject, status: targetColumnId as Project['status'] };
    newColumns[targetColumnIndex].projects.push(updatedProject);
    
    setColumns(newColumns);
    setDraggedProject(null);
  };

  const handleAddProject = (projectData: Omit<Project, 'id' | 'status'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      status: addToColumn as Project['status']
    };

    const newColumns = [...columns];
    const columnIndex = newColumns.findIndex(col => col.id === addToColumn);
    
    if (columnIndex !== -1) {
      newColumns[columnIndex].projects.push(newProject);
      setColumns(newColumns);
    }

    setIsProjectModalOpen(false);
    setAddToColumn("");
  };

  const handleEditProject = (updatedProject: Project) => {
    const newColumns = [...columns];
    
    newColumns.forEach(column => {
      const projectIndex = column.projects.findIndex(p => p.id === updatedProject.id);
      if (projectIndex !== -1) {
        column.projects[projectIndex] = updatedProject;
      }
    });
    
    setColumns(newColumns);
    setIsDetailsModalOpen(false);
    setSelectedProject(null);
  };

  const openAddProjectModal = (columnId: string) => {
    setAddToColumn(columnId);
    setIsProjectModalOpen(true);
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="p-6">
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
              <h2 className="font-semibold text-lg text-brand-black">{column.title}</h2>
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
                    className="card-hover bg-card-gradient border-l-4 border-l-brand-orange cursor-move"
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
                      <div className="flex items-center space-x-2 text-sm text-brand-gray">
                        <User className="w-4 h-4" />
                        <span>{project.client}</span>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className={`${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-brand-gray'}`}>
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
                        <p className="text-xs text-brand-gray line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Links */}
                      {project.links && project.links.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-brand-gray">Links de entrega:</p>
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
              className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-brand-orange hover:bg-brand-orange/5 text-brand-gray hover:text-brand-orange"
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

export default KanbanBoard;
