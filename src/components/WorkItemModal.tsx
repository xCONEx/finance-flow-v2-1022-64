
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

interface WorkItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any;
}

const WorkItemModal = ({ open, onOpenChange, editingItem }: WorkItemModalProps) => {
  const { addWorkItem, updateWorkItem } = useApp();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: '',
    depreciationYears: '5'
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        description: editingItem.description || '',
        category: editingItem.category || '',
        value: editingItem.value?.toString() || '',
        depreciationYears: editingItem.depreciationYears?.toString() || '5'
      });
    } else {
      setFormData({
        description: '',
        category: '',
        value: '',
        depreciationYears: '5'
      });
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.value) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const itemData = {
        description: formData.description,
        category: formData.category,
        value: parseFloat(formData.value),
        depreciationYears: parseInt(formData.depreciationYears),
        userId: user.id
      };

      if (editingItem) {
        await updateWorkItem(editingItem.id, itemData);
        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso!"
        });
      } else {
        await addWorkItem(itemData);
        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso!"
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'Câmeras',
    'Lentes',
    'Iluminação',
    'Áudio',
    'Tripés e Suportes',
    'Acessórios',
    'Computadores',
    'Software',
    'Veículos',
    'Outros'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Canon EOS R5"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="depreciationYears">Anos de Depreciação</Label>
            <Select value={formData.depreciationYears} onValueChange={(value) => setFormData(prev => ({ ...prev, depreciationYears: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 ano</SelectItem>
                <SelectItem value="2">2 anos</SelectItem>
                <SelectItem value="3">3 anos</SelectItem>
                <SelectItem value="5">5 anos</SelectItem>
                <SelectItem value="10">10 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkItemModal;
