import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Check, ChevronsUpDown, Coins } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { firestoreService } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type Framework = {
  value: string
  label: string
}

const frameworks: Framework[] = [
  {
    value: "lucide",
    label: "Lucide",
  },
  {
    value: "tailwind",
    label: "Tailwind",
  },
  {
    value: "radix",
    label: "Radix",
  },
  {
    value: "shadcn",
    label: "shadcn/ui",
  },
  {
    value: "nextui",
    label: "NextUI",
  },
]

const PricingCalculator = () => {
  const { user } = useAuth();
  const [workHours, setWorkHours] = useState(8);
  const [workDays, setWorkDays] = useState(20);
  const [desiredSalary, setDesiredSalary] = useState(5000);
  const [dailyValue, setDailyValue] = useState(0);

  useEffect(() => {
    if (user?.routine) {
      setWorkHours(user.routine.dailyHours || 8);
      setWorkDays(user.routine.workDays || 20);
      setDesiredSalary(user.routine.desiredSalary || 5000);
    }
  }, [user]);

  useEffect(() => {
    // Calcula o valor diário com base no salário desejado e dias de trabalho
    const calculatedDailyValue = desiredSalary / workDays;
    setDailyValue(calculatedDailyValue);
  }, [desiredSalary, workDays]);

  const handleSaveSettings = async () => {
    if (!user) return;

    try {
      await firestoreService.updateUserField(user.id, 'routine', {
        dailyHours: workHours,
        dalilyValue: dailyValue,
        desiredSalary: desiredSalary,
        workDays: workDays
      });

      toast({
        title: "Configurações Salvas",
        description: "Suas configurações de trabalho foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Coins className="w-6 h-6 text-yellow-500" />
          Calculadora de Preços
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Defina suas horas e dias de trabalho para calcular seu valor diário
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defina seus parâmetros de trabalho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-hours">Horas de trabalho por dia</Label>
            <div className="flex items-center justify-between">
              <Input
                type="number"
                id="work-hours"
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                className="w-20"
              />
              <Slider
                defaultValue={[workHours]}
                max={12}
                min={1}
                step={1}
                onValueChange={(value) => setWorkHours(value[0])}
                className="w-full ml-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-days">Dias de trabalho por mês</Label>
            <div className="flex items-center justify-between">
              <Input
                type="number"
                id="work-days"
                value={workDays}
                onChange={(e) => setWorkDays(Number(e.target.value))}
                className="w-20"
              />
              <Slider
                defaultValue={[workDays]}
                max={31}
                min={1}
                step={1}
                onValueChange={(value) => setWorkDays(value[0])}
                className="w-full ml-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desired-salary">Salário desejado (R$)</Label>
            <Input
              type="number"
              id="desired-salary"
              value={desiredSalary}
              onChange={(e) => setDesiredSalary(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor diário (R$)</Label>
            <div className="font-bold text-2xl">
              {dailyValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>

          <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCalculator;
