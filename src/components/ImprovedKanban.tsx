
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Video, 
  Clock, 
  Calendar,
  User, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  FileVideo,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Eye,
  Scissors
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAgency } from '../hooks/useAgency';
import { usePermissions } from '../hooks/usePermissions';

// Definições de tipos para projetos audiovisuais
interface Project {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "baixa" | "media" | "alta";
  description?: string;
  links?: string[];
  status: "filmado" | "edicao" | "revisao" | "entregue";
  createdAt: string;
  updatedAt: string;
  agencyId: string;
  assignedTo?: string[];
}

interface Column {
  title: string;
  color: string;
  icon: React.ComponentType<any>;
  description: string;
  projects: Project[];
}

interface KanbanBoard {
  [key: string]: Column;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  avatar?: string;
  agencyId: string;
  createdAt: string;
}

const ImprovedKanban = () => {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    description: '',
    client: '',
    dueDate: '',
    priority: 'media',
    assignedTo: [],
    links: []
  });
  const [selectedColumn, setSelectedColumn] = useState('filmado');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { user } = useAuth();
  const { agencyData, isLoading: agencyLoading } = useAgency();
  const permissions = usePermissions(agencyData?.userRole || 'viewer');
  const { toast } = useToast();

  useEffect(() => {
    if (agencyData && user) {
      loadTeamMembers();
      loadProjectData();
    } else {
      setIsLoading(false);
    }
  }, [agencyData, user]);

  const loadTeamMembers = async () => {
    if (!agencyData?.id || agencyData.id === 'admin') return;
    
    try {
      // Simular carregamento de membros da equipe
      const mockMembers: TeamMember[] = [
        {
          id: user?.id || '1',
          name: user?.name || 'Usuário',
          email: user?.email || 'user@example.com',
          role: agencyData?.userRole as any || 'editor',
          agencyId: agencyData.id,
          createdAt: new Date().toISOString()
        }
      ];
      
      setTeamMembers(mockMembers);
    } catch (error) {
      console.error('❌ Erro ao carregar equipe:', error);
      if (user) {
        setTeamMembers([{
          id: user.id,
          name: user.name,
          email: user.email,
          role: agencyData?.userRole as any || 'editor',
          agencyId: agencyData.id,
          createdAt: new Date().toISOString()
        }]);
      }
    }
  };

  const loadProjectData = async () => {
    if (!agencyData) return;

    try {
      console.log('📦 Carregando projetos para:', agencyData.id);
      
      // Estrutura inicial do board para projetos audiovisuais
      const initialBoard: KanbanBoard = {
        'filmado': {
          title: 'Filmado',
          color: 'bg-blue-50 border-blue-200',
          icon: Video,
          description: 'Material gravado, aguardando edição',
          projects: []
        },
        'edicao': {
          title: 'Em Edição',
          color: 'bg-orange-50 border-orange-200',
          icon: Scissors,
          description: 'Projeto sendo editado',
          projects: []
        },
        'revisao': {
          title: 'Revisão',
          color: 'bg-yellow-50 border-yellow-200',
          icon: Eye,
          description: 'Aguardando aprovação do cliente',
          projects: []
        },
        'entregue': {
          title: 'Entregue',
          color: 'bg-green-50 border-green-200',
          icon: CheckCircle,
          description: 'Projeto finalizado e entregue',
          projects: []
        }
      };

      setBoard(initialBoard);
    } catch (error) {
      console.error('❌ Erro ao carregar projetos:', error);
      const fallbackBoard: KanbanBoard = {
        'filmado': { title: 'Filmado', color: 'bg-blue-50 border-blue-200', icon: Video, description: 'Material gravado', projects: [] },
        'edicao': { title: 'Em Edição', color: 'bg-orange-50 border-orange-200', icon: Scissors, description: 'Sendo editado', projects: [] },
        'revisao': { title: 'Revisão', color: 'bg-yellow-50 border-yellow-200', icon: Eye, description: 'Aguardando aprovação', projects: [] },
        'entregue': { title: 'Entregue', color: 'bg-green-50 border-green-200', icon: CheckCircle, description: 'Finalizado', projects: [] }
      };
      
      setBoard(fallbackBoard);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !permissions.canEditProjects) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = board[source.droppableId];
      const destColumn = board[destination.droppableId];
      const sourceProjects = [...sourceColumn.projects];
      const destProjects = [...destColumn.projects];
      const [movedProject] = sourceProjects.splice(source.index, 1);
      
      // Atualizar status do projeto
      movedProject.status = destination.droppableId as Project['status'];
      movedProject.updatedAt = new Date().toISOString();
      
      destProjects.splice(destination.index, 0, movedProject);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...sourceColumn,
          projects: sourceProjects
        },
        [destination.droppableId]: {
          ...destColumn,
          projects: destProjects
        }
      };

      setBoard(newBoard);
      
      toast({
        title: "Projeto Movido",
        description: `"${movedProject.title}" movido para ${destColumn.title}`
      });
    } else {
      // Reordenar na mesma coluna
      const column = board[source.droppableId];
      const copiedProjects = [...column.projects];
      const [removed] = copiedProjects.splice(source.index, 1);
      copiedProjects.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...column,
          projects: copiedProjects
        }
      };

      setBoard(newBoard);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.client || !permissions.canEditProjects) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e nome do cliente",
        variant: "destructive"
      });
      return;
    }

    try {
      const project: Project = {
        id: `project_${Date.now()}`,
        title: newProject.title!,
        description: newProject.description || '',
        client: newProject.client!,
        dueDate: newProject.dueDate || '',
        priority: newProject.priority || 'media',
        assignedTo: newProject.assignedTo || [],
        links: newProject.links || [],
        status: selectedColumn as Project['status'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        agencyId: agencyData?.id || ''
      };

      const updatedBoard = {
        ...board,
        [selectedColumn]: {
          ...board[selectedColumn],
          projects: [...board[selectedColumn].projects, project]
        }
      };

      setBoard(updatedBoard);

      // Limpar formulário
      setNewProject({
        title: '',
        description: '',
        client: '',
        dueDate: '',
        priority: 'media',
        assignedTo: [],
        links: []
      });
      setShowAddModal(false);

      toast({
        title: "Projeto Criado",
        description: `"${project.title}" foi adicionado com sucesso`
      });
    } catch (error) {
      console.error('❌ Erro ao criar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar projeto",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isDeadlineNear = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  // Ordem fixa das colunas
  const fixedColumnOrder = ['filmado', 'edicao', 'revisao', 'entregue'];

  // Filtrar projetos por busca
  const filterProjects = (projects: Project[]) => {
    if (!searchTerm) return projects;
    return projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Verificar se o usuário faz parte de uma empresa
  if (!agencyData) {
    return (
      <div className="text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <Video className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-yellow-700">
            O Kanban de Projetos é exclusivo para membros de empresas. 
            Entre em contato com um administrador para ser adicionado a uma empresa.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || agencyLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <FileVideo className="text-purple-600" />
            Gestão de Projetos Audiovisuais
          </h2>
          <p className="text-gray-600">
            {agencyData.name} - Organize seus projetos de filmagem e edição
            {!permissions.canEditProjects && <span className="text-orange-600 ml-2">(Somente visualização)</span>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {/* Botão de novo projeto */}
          {permissions.canEditProjects && (
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do projeto audiovisual
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-2 block">Título do Projeto *</label>
                      <Input
                        placeholder="Ex: Casamento João e Maria"
                        value={newProject.title || ''}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Cliente *</label>
                      <Input
                        placeholder="Nome do cliente"
                        value={newProject.client || ''}
                        onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prazo de Entrega</label>
                      <Input
                        type="date"
                        value={newProject.dueDate || ''}
                        onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Descrição</label>
                    <Textarea
                      placeholder="Detalhes sobre o projeto..."
                      value={newProject.description || ''}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade</label>
                      <Select 
                        value={newProject.priority || 'media'} 
                        onValueChange={(value: 'alta' | 'media' | 'baixa') => setNewProject({...newProject, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Status Inicial</label>
                      <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filmado">Filmado</SelectItem>
                          <SelectItem value="edicao">Em Edição</SelectItem>
                          <SelectItem value="revisao">Revisão</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddProject} className="flex-1">
                    Criar Projeto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={permissions.canEditProjects ? handleDragEnd : () => {}}>
        <div className="grid lg:grid-cols-4 gap-6">
          {fixedColumnOrder.map((columnId) => {
            const column = board[columnId];
            if (!column) return null;
            
            const filteredProjects = filterProjects(column.projects);
            const IconComponent = column.icon;
            
            return (
              <Card key={columnId} className={`${column.color} h-fit`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center font-semibold flex items-center justify-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {filteredProjects.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-center text-gray-600">{column.description}</p>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={columnId} isDropDisabled={!permissions.canEditProjects}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[300px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/50' : ''
                        }`}
                      >
                        {filteredProjects.map((project, index) => (
                          <Draggable 
                            key={project.id} 
                            draggableId={project.id} 
                            index={index}
                            isDragDisabled={!permissions.canEditProjects}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card 
                                  className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                                    snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                  }`}
                                  onClick={() => setSelectedProject(project)}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Header do projeto */}
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-sm line-clamp-2">{project.title}</h4>
                                        <div className="flex gap-1 flex-shrink-0 ml-2">
                                          {isOverdue(project.dueDate) && (
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                          )}
                                          {isDeadlineNear(project.dueDate) && !isOverdue(project.dueDate) && (
                                            <Clock className="h-4 w-4 text-orange-600" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Cliente */}
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs text-gray-600">{project.client}</span>
                                      </div>

                                      {/* Badges */}
                                      <div className="flex gap-1 flex-wrap">
                                        <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                                          {project.priority}
                                        </Badge>
                                      </div>

                                      {/* Data limite */}
                                      {project.dueDate && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-gray-500" />
                                          <span className={`text-xs ${
                                            isOverdue(project.dueDate) ? 'text-red-600 font-medium' :
                                            isDeadlineNear(project.dueDate) ? 'text-orange-600 font-medium' : 
                                            'text-gray-600'
                                          }`}>
                                            {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                                          </span>
                                        </div>
                                      )}

                                      {/* Links */}
                                      {project.links && project.links.length > 0 && (
                                        <div className="flex items-center gap-2">
                                          <ExternalLink className="h-3 w-3 text-green-600" />
                                          <span className="text-xs text-green-600">
                                            {project.links.length} link(s)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de detalhes do projeto */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {selectedProject?.title}
              </span>
              {permissions.canEditProjects && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingProject(!isEditingProject)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <p className="text-sm text-gray-900">{selectedProject.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prioridade</label>
                  <Badge className={`${getPriorityColor(selectedProject.priority)} ml-2`}>
                    {selectedProject.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prazo</label>
                  <p className={`text-sm ${
                    selectedProject.dueDate && isOverdue(selectedProject.dueDate) ? 'text-red-600 font-medium' :
                    selectedProject.dueDate && isDeadlineNear(selectedProject.dueDate) ? 'text-orange-600 font-medium' : 
                    'text-gray-900'
                  }`}>
                    {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{board[selectedProject.status]?.title}</p>
                </div>
              </div>

              {/* Descrição */}
              {selectedProject.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedProject.description}</p>
                </div>
              )}

              {/* Links */}
              <div>
                <label className="text-sm font-medium text-gray-700">Links de Entrega</label>
                <div className="space-y-2 mt-2">
                  {selectedProject.links && selectedProject.links.length > 0 ? (
                    selectedProject.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{link}</span>
                        <Button size="sm" variant="outline" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum link adicionado</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedKanban;
