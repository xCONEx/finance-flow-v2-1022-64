
import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Building2, Shield, Crown, Users, Loader2, Camera, Save, X, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';
import { toast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, userData, companyData, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personalInfo: {
      phone: '',
      company: ''
    }
  });

  // Verificação de tipo de usuário e subscription
  const isCompanyUser = user?.userType === 'company_owner' || user?.userType === 'company_colab';
  const userSubscription = userData?.subscription || { plan: 'free', status: 'active' };

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        personalInfo: {
          phone: userData.personalInfo?.phone || '',
          company: userData.personalInfo?.company || ''
        }
      });
    }
  }, [userData]);

  const getUserTypeDisplay = (userType: string) => {
    const types: Record<string, { label: string; icon: React.ComponentType; color: string }> = {
      admin: { label: 'Administrador', icon: Shield, color: 'bg-purple-100 text-purple-800' },
      company_owner: { label: 'Dono da Empresa', icon: Crown, color: 'bg-yellow-100 text-yellow-800' },
      company_colab: { label: 'Colaborador', icon: Users, color: 'bg-blue-100 text-blue-800' },
      individual: { label: 'Individual', icon: User, color: 'bg-green-100 text-green-800' }
    };
    return types[userType] || types.individual;
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      const updates = {
        name: formData.name,
        email: formData.email,
        personalInfo: {
          phone: formData.personalInfo.phone,
          company: formData.personalInfo.company
        }
      };

      await firestoreService.updateUserData(user.id, updates);
      await refreshUserData();
      setEditing(false);
      
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar informações do perfil.",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      // Simulação de upload - você pode implementar upload real aqui
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Foto Atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const userTypeInfo = getUserTypeDisplay(user.userType);
  const IconComponent = userTypeInfo.icon;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <User className="text-purple-600" />
          Perfil do Usuário
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      {/* Profile Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={userData.imageuser || userData.photoURL || ''} 
                  alt={userData.name || 'Usuario'} 
                />
                <AvatarFallback className="text-2xl">
                  {(userData.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <label className="absolute bottom-0 right-0 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* User Type Badge */}
            <Badge className={userTypeInfo.color}>
              <IconComponent className="h-4 w-4 mr-1" />
              {userTypeInfo.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <Button
                size="sm"
                variant={editing ? "outline" : "default"}
                onClick={() => editing ? setEditing(false) : setEditing(true)}
              >
                {editing ? <X className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                {editing ? 'Cancelar' : 'Editar'}
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Seu nome completo"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{userData.name || 'Não informado'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{userData.email || 'Não informado'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={formData.personalInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData, 
                      personalInfo: {...formData.personalInfo, phone: e.target.value}
                    })}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{userData.personalInfo?.phone || 'Não informado'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                {editing ? (
                  <Input
                    id="company"
                    value={formData.personalInfo.company}
                    onChange={(e) => setFormData({
                      ...formData, 
                      personalInfo: {...formData.personalInfo, company: e.target.value}
                    })}
                    placeholder="Nome da sua empresa"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{userData.personalInfo?.company || 'Não informado'}</span>
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Company Info */}
          {isCompanyUser && companyData && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações da Empresa
                </h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div>
                      <p className="font-medium">{companyData.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Plano: {companyData.plan === 'premium' ? 'Premium' : 'Gratuito'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {user.userType === 'company_owner' ? 'Proprietário' : 'Colaborador'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalhes da Conta</h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Membro desde</span>
                </div>
                <span className="text-sm font-medium">
                  {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Tipo de Conta</span>
                </div>
                <Badge className={userTypeInfo.color}>
                  <IconComponent className="h-3 w-3 mr-1" />
                  {userTypeInfo.label}
                </Badge>
              </div>

              {!isCompanyUser && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Plano</span>
                  </div>
                  <Badge variant={userSubscription.plan === 'premium' ? 'default' : 'secondary'}>
                    {userSubscription.plan === 'premium' ? 'Premium' : 'Gratuito'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info for Company Users */}
      {user.userType === 'company_colab' && companyData && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Colaboração em Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div>
                  <p className="font-medium">Você é colaborador em:</p>
                  <p className="text-lg font-bold text-blue-600">{companyData.name}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Colaborador Ativo
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Como colaborador, você tem acesso aos projetos compartilhados da empresa e pode contribuir para o Kanban e tarefas em equipe.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
