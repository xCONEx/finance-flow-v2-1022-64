
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project } from '../types/project';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  agencyId?: string;
}

const ProjectModal = ({ isOpen, onClose, onSave, agencyId = 'default-agency' }: ProjectModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    dueDate: '',
    priority: 'media' as Project['priority'],
    description: '',
    status: 'filmado' as Project['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      agencyId,
      links: [],
      assignedTo: []
    };
    
    onSave(projectData);
    setFormData({
      title: '',
      client: '',
      dueDate: '',
      priority: 'media',
      description: '',
      status: 'filmado'
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleChange('client', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="dueDate">Data de Entrega</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
