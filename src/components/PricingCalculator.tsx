import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, Clock, Target, Briefcase, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useApp } from '../contexts/AppContext';

const PricingCalculator = () => {
  const [serviceType, setServiceType] = useState('filmagem');
  const [difficulty, setDifficulty] = useState('médio');
  const [hours, setHours] = useState(8);
  const [equipmentCost, setEquipmentCost] = useState(100);
  const [logisticsCost, setLogisticsCost] = useState(50);
  const [assistanceCost, setAssistanceCost] = useState(30);
  const [profitMargin, setProfitMargin] = useState(30);
  const [discount, setDiscount] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [error, setError] = useState('');

  const { formatValue } = usePrivacy();
	const { jobs } = useApp();

  useEffect(() => {
    calculatePrice();
  }, [serviceType, difficulty, hours, equipmentCost, logisticsCost, assistanceCost, profitMargin, discount, jobs]);

  const calculatePrice = () => {
    if (hours <= 0 || equipmentCost < 0 || logisticsCost < 0 || assistanceCost < 0 || profitMargin < 0 || discount < 0) {
      setError('Por favor, insira valores não negativos.');
      return;
    }

    setError('');

    let baseValue = 0;
    switch (difficulty) {
      case 'fácil':
        baseValue = 50;
        break;
      case 'médio':
        baseValue = 100;
        break;
      case 'complicado':
        baseValue = 150;
        break;
      case 'difícil':
        baseValue = 200;
        break;
      default:
        baseValue = 100;
    }

    let totalCost = equipmentCost + logisticsCost + assistanceCost;
    let serviceValue = baseValue * hours;
    let profit = serviceValue * (profitMargin / 100);
    let finalValue = serviceValue + profit + totalCost;
    let discountAmount = finalValue * (discount / 100);
    let discountedValue = finalValue - discountAmount;

    setCalculatedPrice(discountedValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-purple-600" />
          Calculadora de Orçamento
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service-type">Tipo de Serviço</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger id="service-type">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filmagem">Filmagem</SelectItem>
                <SelectItem value="fotografia">Fotografia</SelectItem>
                <SelectItem value="edição">Edição</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">Nível de Dificuldade</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fácil">Fácil</SelectItem>
                <SelectItem value="médio">Médio</SelectItem>
                <SelectItem value="complicado">Complicado</SelectItem>
                <SelectItem value="difícil">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hours">
              Horas Estimadas <Badge variant="secondary">Opcional</Badge>
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="hours"
                placeholder="8"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <Clock className="absolute top-2.5 right-2 h-5 w-5 text-gray-500 peer-focus:text-purple-600" />
            </div>
          </div>

          <div>
            <Label htmlFor="equipment-cost">
              Custo de Equipamento <Badge variant="secondary">Opcional</Badge>
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="equipment-cost"
                placeholder="100"
                value={equipmentCost}
                onChange={(e) => setEquipmentCost(Number(e.target.value))}
              />
              <Briefcase className="absolute top-2.5 right-2 h-5 w-5 text-gray-500 peer-focus:text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="logistics-cost">
              Custo de Logística <Badge variant="secondary">Opcional</Badge>
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="logistics-cost"
                placeholder="50"
                value={logisticsCost}
                onChange={(e) => setLogisticsCost(Number(e.target.value))}
              />
              <Target className="absolute top-2.5 right-2 h-5 w-5 text-gray-500 peer-focus:text-purple-600" />
            </div>
          </div>

          <div>
            <Label htmlFor="assistance-cost">
              Custo de Assistência <Badge variant="secondary">Opcional</Badge>
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="assistance-cost"
                placeholder="30"
                value={assistanceCost}
                onChange={(e) => setAssistanceCost(Number(e.target.value))}
              />
              <Briefcase className="absolute top-2.5 right-2 h-5 w-5 text-gray-500 peer-focus:text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="profit-margin">Margem de Lucro (%)</Label>
            <Input
              type="number"
              id="profit-margin"
              placeholder="30"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              type="number"
              id="discount"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label>Preço Calculado</Label>
          <div className="relative">
            <Input
              type="text"
              value={formatValue(calculatedPrice)}
              readOnly
            />
            <DollarSign className="absolute top-2.5 right-2 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <Button onClick={calculatePrice}>
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Orçamento
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCalculator;
