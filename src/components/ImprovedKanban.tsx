
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  User, 
  Plus, 
  Edit, 
  Trash2,
  MessageCircle,
  Paperclip,
  Calendar,
  Save,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';
import KanbanCard from './KanbanCard';
import TagManager from './TagManager';

// Definições de tipos
interface KanbanTask {
  id: string;
  title: string;
  description: string;
  value: string;
  deadline: string;
  responsible: string;
  type: string;
  comments: number;
  attachments: number;
  priority: 'alta' | 'média' | 'baixa';
  createdAt: string;
  tags?: string[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface KanbanColumn {
  title: string;
  color: string;
  items: KanbanTask[];
}

interface KanbanBoard {
  [key: string]: KanbanColumn;
}

interface TeamMember {
  uid: string;
  email: string;
  name: string;
  role: string;
}

const ImprovedKanban = () => {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskValue, setNewTaskValue] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskResponsible, setNewTaskResponsible] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'alta' | 'média' | 'baixa'>('média');
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (agencyData) {
      loadKanbanData();
      loadTeamMembers();
    } else {
      setIsLoading(false);
    }
  }, [agencyData]);

  const loadTeamMembers = async () => {
    if (!agencyData) return;
    
    try {
      console.log('👥 Carregando membros da equipe...');
      const members: TeamMember[] = [];
      
      // Adicionar owner
      if (agencyData.ownerUID) {
        const ownerData = await firestoreService.getUserData(agencyData.ownerUID);
        if (ownerData) {
          members.push({
            uid: agencyData.ownerUID,
            email: ownerData.email,
            name: ownerData.name || ownerData.email.split('@')[0],
            role: 'owner'
          });
        }
      }
      
      // Adicionar colaboradores
      if (agencyData.colaboradores && typeof agencyData.colaboradores === 'object') {
        for (const [uid, role] of Object.entries(agencyData.colaboradores)) {
          if (uid !== agencyData.ownerUID) { // Evitar duplicar o owner
            const memberData = await firestoreService.getUserData(uid);
            if (memberData) {
              members.push({
                uid: uid,
                email: memberData.email,
                name: memberData.name || memberData.email.split('@')[0],
                role: role as string
              });
            }
          }
        }
      }
      
      setTeamMembers(members);
      console.log('✅ Membros carregados:', members.length);
    } catch (error) {
      console.error('❌ Erro ao carregar membros da equipe:', error);
    }
  };

  const loadKanbanData = async () => {
    if (!agencyData) return;

    try {
      console.log('📦 Carregando dados do Kanban para empresa:', agencyData.id);
      
      const existingBoard = await firestoreService.getKanbanBoard(agencyData.id);
      
      if (existingBoard && existingBoard.columns) {
        console.log('✅ Board existente carregado do Firebase');
        setBoard(existingBoard.columns);
        setTags(existingBoard.tags || []);
      } else {
        console.log('📝 Criando board inicial para empresa');
        const initialBoard: KanbanBoard = {
          'todo': {
            title: 'A Fazer',
            color: 'bg-red-50 border-red-200',
            items: []
          },
          'inProgress': {
            title: 'Em Produção',
            color: 'bg-yellow-50 border-yellow-200',
            items: []
          },
          'review': {
            title: 'Em Revisão',
            color: 'bg-blue-50 border-blue-200',
            items: []
          },
          'done': {
            title: 'Finalizado',
            color: 'bg-green-50 border-green-200',
            items: []
          }
        };

        const initialTags: Tag[] = [
          { id: 'tag_1', name: 'Urgente', color: '#EF4444' },
          { id: 'tag_2', name: 'Importante', color: '#F59E0B' },
          { id: 'tag_3', name: 'Baixa Prioridade', color: '#10B981' }
        ];

        setBoard(initialBoard);
        setTags(initialTags);
        await saveKanbanState(initialBoard, initialTags);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar Kanban:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveKanbanState = async (boardData: KanbanBoard, tagsData: Tag[] = tags) => {
    if (!agencyData) return;

    try {
      console.log('💾 Salvando estado do Kanban no Firebase...');
      const kanbanData = {
        columns: boardData,
        tags: tagsData,
        updatedAt: new Date().toISOString()
      };
      await firestoreService.saveKanbanBoard(agencyData.id, kanbanData);
      console.log('✅ Kanban salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar Kanban:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Mover entre colunas
      const sourceColumn = board[source.droppableId];
      const destColumn = board[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems
        }
      };

      setBoard(newBoard);
      await saveKanbanState(newBoard);
      
      toast({
        title: "Sucesso",
        description: `Tarefa "${removed.title}" movida para ${destColumn.title}`
      });
    } else {
      // Reordenar na mesma coluna
      const column = board[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...column,
          items: copiedItems
        }
      };

      setBoard(newBoard);
      await saveKanbanState(newBoard);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !newTaskDescription) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const newTask: KanbanTask = {
        id: `task_${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDescription,
        value: newTaskValue || 'Não informado',
        deadline: newTaskDeadline || 'Não definido',
        responsible: newTaskResponsible || user?.name || 'Não atribuído',
        type: newTaskType || 'Geral',
        comments: 0,
        attachments: 0,
        priority: newTaskPriority,
        createdAt: new Date().toISOString(),
        tags: selectedTags
      };

      const updatedBoard = {
        ...board,
        [selectedColumn]: {
          ...board[selectedColumn],
          items: [...board[selectedColumn].items, newTask]
        }
      };

      setBoard(updatedBoard);
      await saveKanbanState(updatedBoard);

      // Limpar formulário
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskValue('');
      setNewTaskDeadline('');
      setNewTaskResponsible('');
      setNewTaskType('');
      setNewTaskPriority('média');
      setSelectedTags([]);

      toast({
        title: "Sucesso",
        description: "Tarefa adicionada com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleSaveTaskEdit = async () => {
    if (!selectedTask) return;

    try {
      let updatedBoard = { ...board };

      Object.keys(updatedBoard).forEach(columnId => {
        const taskIndex = updatedBoard[columnId].items.findIndex(item => item.id === selectedTask.id);
        if (taskIndex !== -1) {
          updatedBoard[columnId].items[taskIndex] = selectedTask;
        }
      });

      setBoard(updatedBoard);
      await saveKanbanState(updatedBoard);
      setIsEditingTask(false);

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao salvar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      let updatedBoard = { ...board };

      Object.keys(updatedBoard).forEach(columnId => {
        updatedBoard[columnId].items = updatedBoard[columnId].items.filter(item => item.id !== taskId);
      });

      setBoard(updatedBoard);
      await saveKanbanState(updatedBoard);
      setSelectedTask(null);

      toast({
        title: "Sucesso",
        description: "Tarefa removida com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleAddTag = (tag: Tag) => {
    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    saveKanbanState(board, updatedTags);
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    saveKanbanState(board, updatedTags);
  };

  const handleTagSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Filmagem': return 'bg-blue-100 text-blue-800';
      case 'Edição': return 'bg-purple-100 text-purple-800';
      case 'Motion Graphics': return 'bg-orange-100 text-orange-800';
      case 'Geral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'média': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ordem fixa das colunas
  const fixedColumnOrder = ['todo', 'inProgress', 'review', 'done'];

  // Verificar se o usuário faz parte de uma empresa
  if (!agencyData) {
    return (
      <div className="text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <Briefcase className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Kanban de Projetos
          </h2>
          <p className="text-gray-600">
            {agencyData.name} - Gerencie o fluxo dos seus projetos
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título da tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              
              <Textarea
                placeholder="Descrição detalhada"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Valor (R$)"
                  value={newTaskValue}
                  onChange={(e) => setNewTaskValue(e.target.value)}
                />
                <Input
                  type="date"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={newTaskResponsible} onValueChange={setNewTaskResponsible}>
                  <SelectTrigger>
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.uid} value={member.name}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={newTaskType} onValueChange={setNewTaskType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Filmagem">Filmagem</SelectItem>
                    <SelectItem value="Edição">Edição</SelectItem>
                    <SelectItem value="Motion Graphics">Motion Graphics</SelectItem>
                    <SelectItem value="Geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="inProgress">Em Produção</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="done">Finalizado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={newTaskPriority} onValueChange={(value: 'alta' | 'média' | 'baixa') => setNewTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Etiquetas</label>
                <TagManager 
                  tags={tags}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  selectedTags={selectedTags}
                  onTagSelect={handleTagSelect}
                />
              </div>

              <Button onClick={handleAddTask} className="w-full">
                Adicionar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-4 gap-6">
          {fixedColumnOrder.map((columnId) => {
            const column = board[columnId];
            if (!column) return null;
            
            return (
              <Card key={columnId} className={`${column.color} h-fit`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center font-semibold">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.items?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[300px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/50' : ''
                        }`}
                      >
                        {(column.items || []).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <KanbanCard
                                  task={item}
                                  tags={tags}
                                  onClick={() => setSelectedTask(item)}
                                  isDragging={snapshot.isDragging}
                                />
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

      {/* Modal de visualização/edição de tarefa */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes da Tarefa
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingTask(!isEditingTask)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTask(selectedTask?.id || '')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                {isEditingTask ? (
                  <Input
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                {isEditingTask ? (
                  <Textarea
                    value={selectedTask.description}
                    onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  {isEditingTask ? (
                    <Input
                      value={selectedTask.value}
                      onChange={(e) => setSelectedTask({...selectedTask, value: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{selectedTask.value}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Prazo</label>
                  {isEditingTask ? (
                    <Input
                      type="date"
                      value={selectedTask.deadline}
                      onChange={(e) => setSelectedTask({...selectedTask, deadline: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{selectedTask.deadline}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Responsável</label>
                {isEditingTask ? (
                  <Select
                    value={selectedTask.responsible}
                    onValueChange={(value) => setSelectedTask({...selectedTask, responsible: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.uid} value={member.name}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.responsible}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                {isEditingTask ? (
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(value: 'alta' | 'média' | 'baixa') => setSelectedTask({...selectedTask, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getPriorityColor(selectedTask.priority)} variant="secondary">
                    {selectedTask.priority}
                  </Badge>
                )}
              </div>

              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {selectedTask.tags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Badge
                          key={tag.id}
                          style={{ backgroundColor: tag.color, color: 'white' }}
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {isEditingTask && (
                <Button onClick={handleSaveTaskEdit} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedKanban;
