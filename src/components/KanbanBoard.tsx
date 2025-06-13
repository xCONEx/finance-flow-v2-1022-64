
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Project {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "baixa" | "media" | "alta";
  status: "filmado" | "edicao" | "revisao" | "entregue";
  assignedTo?: string[];
}

interface KanbanBoardProps {
  projects: Project[];
  onProjectMove: (projectId: string, newStatus: string) => void;
  onProjectClick?: (project: Project) => void;
}

const KanbanBoard = ({ projects, onProjectMove, onProjectClick }: KanbanBoardProps) => {
  const columns = [
    { id: 'filmado', title: 'Filmado', color: 'bg-blue-100' },
    { id: 'edicao', title: 'Em Edição', color: 'bg-yellow-100' },
    { id: 'revisao', title: 'Revisão', color: 'bg-orange-100' },
    { id: 'entregue', title: 'Entregue', color: 'bg-green-100' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const projectId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    onProjectMove(projectId, newStatus);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className={`rounded-lg ${column.color} p-4`}>
            <h3 className="font-semibold text-gray-800 mb-4">{column.title}</h3>
            
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 min-h-[200px]"
                >
                  {projects
                    .filter(project => project.status === column.id)
                    .map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => onProjectClick?.(project)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium truncate">
                                  {project.title}
                                </CardTitle>
                                <Badge 
                                  className={`${getPriorityColor(project.priority)} text-white text-xs`}
                                >
                                  {project.priority}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="flex items-center text-xs text-gray-600">
                                  <User className="w-3 h-3 mr-1" />
                                  {project.client}
                                </div>
                                <div className={`flex items-center text-xs ${
                                  isOverdue(project.dueDate) ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {format(new Date(project.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                                  {isOverdue(project.dueDate) && (
                                    <AlertCircle className="w-3 h-3 ml-1" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
