
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost?: any;
}

const ExpenseModal = ({ open, onOpenChange, editingCost }: ExpenseModalProps) => {
  const { addMonthlyCost, updateMonthlyCost } = useApp();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: '',
    month: new Date().toISOString().slice(0, 7)
  });

  useEffect(() => {
    if (editingCost) {
      setFormData({
        description: editingCost.description || '',
        category: editingCost.category || '',
        value: editingCost.value?.toString() || '',
        month: editingCost.month || new Date().toISOString().slice(0, 7)
      });
    } else {
      setFormData({
        description: '',
        category: '',
        value: '',
        month: new Date().toISOString().slice(0, 7)
      });
    }
  }, [editingCost, open]);

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
      const costData = {
        description: formData.description,
        category: formData.category,
        value: parseFloat(formData.value),
        month: formData.month,
        userId: user.id
      };

      if (editingCost) {
        await updateMonthlyCost(editingCost.id, costData);
        toast({
          title: "Sucesso",
          description: "Custo atualizado com sucesso!"
        });
      } else {
        await addMonthlyCost(costData);
        toast({
          title: "Sucesso",
          description: "Custo adicionado com sucesso!"
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar custo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'Geral',
    'Marketing',
    'Equipamentos',
    'Transporte',
    'Aluguel',
    'Utilidades',
    'Seguros',
    'Software/Licenças',
    'Manutenção',
    'Consultoria',
    'Outros'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Editar Custo' : 'Adicionar Novo Custo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Aluguel do escritório"
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
            <Label htmlFor="month">Mês de Referência</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
            />
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
              {submitting ? 'Salvando...' : editingCost ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
