
import React, { useState } from 'react';
import { DollarSign, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpenseModal = ({ open, onOpenChange }: ExpenseModalProps) => {
  const { addMonthlyCost } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0
  });

  const handleSave = async () => {
    if (!formData.description || !formData.category || formData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addMonthlyCost({
        description: formData.description,
        category: formData.category,
        value: formData.value,
        month: new Date().toISOString().slice(0, 7)
      });

      toast({
        title: "Despesa Adicionada",
        description: "A despesa foi adicionada com sucesso.",
      });

      setFormData({ description: '', category: '', value: 0 });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar despesa.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Nova Despesa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Descrição *</Label>
            <Input
              id="expense-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Energia elétrica"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoria *</Label>
            <Input
              id="expense-category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="Ex: Utilidades"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-value">Valor (R$) *</Label>
            <CurrencyInput
              id="expense-value"
              value={formData.value}
              onChange={(value) => setFormData({...formData, value})}
              placeholder="0,00"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
