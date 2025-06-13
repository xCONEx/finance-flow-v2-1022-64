
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from '../types/project';

export interface KanbanBoardProps {
  projects: Project[];
  onProjectMove: (projectId: string, newStatus: Project['status']) => void;
}

const KanbanBoard = ({ projects, onProjectMove }: KanbanBoardProps) => {
  const columns = [
    { id: 'filmado', title: 'Filmado', color: 'bg-blue-100' },
    { id: 'edicao', title: 'Em Edição', color: 'bg-yellow-100' },
    { id: 'revisao', title: 'Revisão', color: 'bg-orange-100' },
    { id: 'entregue', title: 'Entregue', color: 'bg-green-100' }
  ];

  const getProjectsByStatus = (status: string) => {
    return projects.filter(project => project.status === status);
  };

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Project['status']) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    onProjectMove(projectId, newStatus);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`${column.color} rounded-lg p-4 min-h-[500px]`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id as Project['status'])}
        >
          <h3 className="font-semibold mb-4 text-center">{column.title}</h3>
          <div className="space-y-3">
            {getProjectsByStatus(column.id).map((project) => (
              <Card
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                className="cursor-move hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-2">{project.client}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                      {project.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
