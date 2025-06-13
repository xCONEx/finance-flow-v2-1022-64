
import React, { useState } from 'react';
import { Settings as SettingsIcon, Palette, Shield, Globe, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const { currentTheme, changeTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const [notifications, setNotifications] = useState(true);

  // Check if user is in a company
  const isInCompany = user?.userType === 'enterprise' && !!user.companyId;

  const availableThemes = [
    { name: 'Roxo & Azul', value: 'purple-blue' },
    { name: 'Verde & Azul', value: 'green-blue' },
    { name: 'Laranja & Vermelho', value: 'orange-red' }
  ];

  const handleThemeChange = (themeName: string) => {
    changeTheme(themeName);
    toast({
      title: "Tema Alterado",
      description: `Tema ${themeName} aplicado com sucesso.`,
    });
  };

  const handlePrivacyToggle = () => {
    toggleValuesVisibility();
    toast({
      title: valuesHidden ? "Privacidade Desabilitada" : "Privacidade Habilitada",
      description: valuesHidden 
        ? "Os valores agora serão exibidos normalmente."
        : "Os valores agora serão mascarados para privacidade.",
    });
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    toast({
      title: notifications ? "Notificações Desabilitadas" : "Notificações Habilitadas",
      description: notifications 
        ? "Você não receberá mais notificações."
        : "Você receberá notificações sobre atividades importantes.",
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <SettingsIcon className={`text-${currentTheme.accent}`} />
          Configurações
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Personalize sua experiência</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select onValueChange={handleThemeChange} defaultValue={currentTheme.name}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {availableThemes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="privacy">Mascarar valores</Label>
            <Switch id="privacy" checked={valuesHidden} onCheckedChange={handlePrivacyToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Ativar notificações</Label>
            <Switch id="notifications" checked={notifications} onCheckedChange={handleNotificationToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Idioma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select defaultValue="pt-BR" disabled>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione um idioma" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
