import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Moon, Sun, Bell, Globe, Palette, Shield, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { isDark, toggleDarkMode, currentTheme, changeTheme, settings, updateSettings } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState(settings.notifications);

  const handleNotificationChange = (enabled: boolean) => {
    setNotifications(enabled);
    updateSettings({ notifications: enabled });
  };

  const isCompanyUser = userData?.userType === 'company_owner' || userData?.userType === 'company_colab';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative o modo escuro.
              </p>
            </div>
            <Switch id="dark-mode" checked={isDark} onCheckedChange={toggleDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide-values">Ocultar Valores</Label>
              <p className="text-sm text-muted-foreground">
                Oculte os valores monetários para maior privacidade.
              </p>
            </div>
            <Switch id="hide-values" checked={valuesHidden} onCheckedChange={toggleValuesVisibility} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Tema de Cores</Label>
            <p className="text-sm text-muted-foreground">
              Escolha o tema de cores da sua preferência.
            </p>
            <Select value={currentTheme.name} onValueChange={changeTheme}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purple-blue">Roxo & Azul</SelectItem>
                <SelectItem value="green-blue">Verde & Azul</SelectItem>
                <SelectItem value="orange-red">Laranja & Vermelho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative as notificações.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationChange}
            />
          </div>
          {isCompanyUser && (
            <div className="space-y-2">
              <Label htmlFor="company-settings">Configurações da Empresa</Label>
              <p className="text-sm text-muted-foreground">
                Gerencie as configurações da sua empresa.
              </p>
              <Button variant="outline">Gerenciar Empresa</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
