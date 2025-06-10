
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Edit, Trash2, Plus, DollarSign } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { getDifficultyMultiplier } from '../utils/formatters';
import { toast } from '@/hooks/use-toast';
import { Job } from '@/types';

interface JobEditorProps {
  job?: Job;
  onSave?: () => void;
  children?: React.ReactNode;
}

const JobEditor = ({ job, onSave, children }: JobEditorProps) => {
  const { addJob, updateJob } = useApp();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: '',
    difficultyLevel: 'fácil' as Job['difficultyLevel'],
    logistics: '',
    equipment: '',
    assistance: '',
    status: 'pendente' as Job['status'],
    category: '',
    discountValue: '',
    serviceValue: '',
    profitMargin: ''
  });

  useEffect(() => {
    if (job) {
      setFormData({
        description: job.description || '',
        client: job.client || '',
        eventDate: job.eventDate || '',
        estimatedHours: job.estimatedHours?.toString() || '',
        difficultyLevel: job.difficultyLevel || 'fácil',
        logistics: job.logistics?.toString() || '',
        equipment: job.equipment?.toString() || '',
        assistance: job.assistance?.toString() || '',
        status: job.status || 'pendente',
        category: job.category || '',
        discountValue: job.discountValue?.toString() || '',
        serviceValue: job.serviceValue?.toString() || '',
        profitMargin: job.profitMargin?.toString() || ''
      });
    } else {
      setFormData({
        description: '',
        client: '',
        eventDate: '',
        estimatedHours: '',
        difficultyLevel: 'fácil',
        logistics: '',
        equipment: '',
        assistance: '',
        status: 'pendente',
        category: '',
        discountValue: '',
        serviceValue: '',
        profitMargin: ''
      });
    }
  }, [job, open]);

  const calculateTotals = () => {
    const hours = parseFloat(formData.estimatedHours) || 0;
    const logistics = parseFloat(formData.logistics) || 0;
    const equipment = parseFloat(formData.equipment) || 0;
    const assistance = parseFloat(formData.assistance) || 0;
    const serviceValue = parseFloat(formData.serviceValue) || 0;
    const discountValue = parseFloat(formData.discountValue) || 0;

    const totalCosts = logistics + equipment + assistance;
    const valueWithDiscount = serviceValue - discountValue;
    const profit = valueWithDiscount - totalCosts;

    return {
      totalCosts,
      valueWithDiscount,
      profit
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.client) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
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
      const { totalCosts, valueWithDiscount } = calculateTotals();
      
      const jobData = {
        eventDate: formData.eventDate,
        description: formData.description,
        client: formData.client,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        difficultyLevel: formData.difficultyLevel,
        logistics: parseFloat(formData.logistics) || 0,
        equipment: parseFloat(formData.equipment) || 0,
        assistance: parseFloat(formData.assistance) || 0,
        status: formData.status,
        category: formData.category,
        discountValue: parseFloat(formData.discountValue) || 0,
        totalCosts,
        serviceValue: parseFloat(formData.serviceValue) || 0,
        valueWithDiscount,
        profitMargin: parseFloat(formData.profitMargin) || 0,
        userId: user.id
      };

      if (job) {
        await updateJob(job.id, jobData);
        toast({
          title: "Sucesso",
          description: "Job atualizado com sucesso!"
        });
      } else {
        await addJob(jobData);
        toast({
          title: "Sucesso", 
          description: "Job criado com sucesso!"
        });
      }

      setOpen(false);
      if (onSave) onSave();
    } catch (error) {
      console.error('Erro ao salvar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar job",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const { totalCosts, valueWithDiscount, profit } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {job ? 'Editar Job' : 'Novo Job'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {job ? 'Editar Job' : 'Criar Novo Job'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do evento"
                required
              />
            </div>

            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div>
              <Label htmlFor="eventDate">Data do Evento</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="difficultyLevel">Nível de Dificuldade</Label>
              <Select value={formData.difficultyLevel} onValueChange={(value: Job['difficultyLevel']) => setFormData(prev => ({ ...prev, difficultyLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fácil">Fácil</SelectItem>
                  <SelectItem value="médio">Médio</SelectItem>
                  <SelectItem value="complicado">Complicado</SelectItem>
                  <SelectItem value="difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Casamento, Evento Corporativo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="logistics">Logística (R$)</Label>
              <Input
                id="logistics"
                type="number"
                step="0.01"
                min="0"
                value={formData.logistics}
                onChange={(e) => setFormData(prev => ({ ...prev, logistics: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="equipment">Equipamentos (R$)</Label>
              <Input
                id="equipment"
                type="number"
                step="0.01"
                min="0"
                value={formData.equipment}
                onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="assistance">Assistência (R$)</Label>
              <Input
                id="assistance"
                type="number"
                step="0.01"
                min="0"
                value={formData.assistance}
                onChange={(e) => setFormData(prev => ({ ...prev, assistance: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
              <Input
                id="serviceValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.serviceValue}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceValue: e.target.value }))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discountValue">Desconto (R$)</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.profitMargin}
                onChange={(e) => setFormData(prev => ({ ...prev, profitMargin: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Job['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo dos Cálculos */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Custos Totais</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(totalCosts)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor com Desconto</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(valueWithDiscount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Estimado</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
              {submitting ? 'Salvando...' : job ? 'Atualizar Job' : 'Criar Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobEditor;
