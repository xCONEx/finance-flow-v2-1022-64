
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Mail, 
  Plus, 
  UserCheck, 
  Building2,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

interface TeamMember {
  uid: string;
  email: string;
  name: string;
  role: string;
}

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (agencyData) {
      loadCompanyData();
    } else {
      setIsLoading(false);
    }
  }, [agencyData]);

  const loadCompanyData = async () => {
    if (!agencyData) return;
    
    try {
      console.log('🏢 Carregando dados da empresa...', agencyData.id);
      setIsLoading(true);
      
      const members: TeamMember[] = [];
      
      // Adicionar owner
      if (agencyData.ownerUID) {
        try {
          const ownerData = await firestoreService.getUserData(agencyData.ownerUID);
          if (ownerData) {
            members.push({
              uid: agencyData.ownerUID,
              email: ownerData.email,
              name: ownerData.name || ownerData.email.split('@')[0],
              role: 'owner'
            });
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados do owner:', error);
        }
      }
      
      // Adicionar colaboradores com suas roles
      if (agencyData.colaboradores && typeof agencyData.colaboradores === 'object') {
        for (const [uid, role] of Object.entries(agencyData.colaboradores)) {
          if (uid !== agencyData.ownerUID) { // Evitar duplicar o owner
            try {
              const memberData = await firestoreService.getUserData(uid);
              if (memberData) {
                members.push({
                  uid: uid,
                  email: memberData.email,
                  name: memberData.name || memberData.email.split('@')[0],
                  role: role as string
                });
              }
            } catch (error) {
              console.error(`❌ Erro ao carregar dados do colaborador ${uid}:`, error);
              // Adicionar membro mesmo sem dados completos
              members.push({
                uid: uid,
                email: 'Email não disponível',
                name: 'Nome não disponível',
                role: role as string
              });
            }
          }
        }
      }
      
      console.log('✅ Membros carregados:', members);
      setTeamMembers(members);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemberDirect = async () => {
    if (!inviteEmail?.trim() || !agencyData) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMember(true);

    try {
      console.log('🔍 Procurando usuário com e-mail:', inviteEmail);
      
      // Verificar se o usuário já é membro
      const isAlreadyMember = teamMembers.some(member => member.email.toLowerCase() === inviteEmail.toLowerCase());
      if (isAlreadyMember) {
        toast({
          title: "Erro",
          description: "Este usuário já é membro da equipe",
          variant: "destructive"
        });
        return;
      }

      const userBasic = await firestoreService.getUserByEmail(inviteEmail);

      if (!userBasic) {
        toast({
          title: "Usuário não encontrado",
          description: "Esse e-mail ainda não está cadastrado na plataforma.",
          variant: "destructive"
        });
        return;
      }

      console.log('👤 Usuário encontrado:', userBasic);

      // Adicionar membro à empresa
      await firestoreService.addCompanyMember(agencyData.id, userBasic.id, inviteRole);

      // Limpar formulário
      setInviteEmail('');
      setInviteRole('viewer');
      
      // Recarregar dados
      await loadCompanyData();

      const displayName = userBasic.name?.trim() || userBasic.email?.split('@')[0] || 'Usuário';

      toast({
        title: "Sucesso",
        description: `${displayName} foi adicionado como ${getRoleLabel(inviteRole)}!`
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro. Verifique as permissões.",
        variant: "destructive"
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberUid: string, memberName: string) => {
    if (!agencyData) return;

    try {
      console.log('🗑️ Removendo membro:', memberUid);
      
      await firestoreService.removeCompanyMember(agencyData.id, memberUid);
      await loadCompanyData(); // Recarregar dados
      
      toast({
        title: "Sucesso",
        description: `${memberName} foi removido da equipe`
      });
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      default: return 'Colaborador';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'editor': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageMembers = (userRole: string) => {
    return userRole === 'owner';
  };

  const canRemoveMembers = (userRole: string, targetRole: string) => {
    return userRole === 'owner' && targetRole !== 'owner';
  };

  // Determinar role do usuário atual
  const currentUserRole = agencyData?.ownerUID === user?.id ? 'owner' : 
    agencyData?.colaboradores?.[user?.id] || 'viewer';

  if (!agencyData) {
    return (
      <div className="text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <AlertTriangle className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-yellow-700">
            Você precisa fazer parte de uma empresa para acessar esta seção.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Building2 className="text-purple-600" />
          {agencyData?.name || 'Sua Empresa'}
        </h2>
        <p className="text-gray-600">Gestão de equipe e colaboradores</p>
      </div>

      {/* Estatísticas da Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{teamMembers.length}</p>
            <p className="text-sm text-gray-600">Membros da Equipe</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            {getRoleIcon(currentUserRole)}
            <p className="text-sm font-medium mt-2">{getRoleLabel(currentUserRole)}</p>
            <p className="text-xs text-gray-600">Seu Papel</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-sm font-medium mt-2">Empresa Ativa</p>
            <p className="text-xs text-gray-600">Status</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membros da Equipe</CardTitle>
          {canManageMembers(currentUserRole) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Membro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email do colaborador</label>
                    <Input
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={isAddingMember}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Permissão</label>
                    <Select value={inviteRole} onValueChange={setInviteRole} disabled={isAddingMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-blue-600" />
                            Editor - Pode editar projetos e tarefas
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-600" />
                            Visualizador - Apenas visualizar
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleAddMemberDirect} 
                    className="w-full"
                    disabled={isAddingMember}
                  >
                    {isAddingMember ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Adicionar Membro
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum membro na equipe</p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 ml-13">
                      <Badge className={`${getRoleBadgeColor(member.role)} flex items-center gap-1`}>
                        {getRoleIcon(member.role)}
                        {getRoleLabel(member.role)}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                  
                  {canRemoveMembers(currentUserRole, member.role) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.uid, member.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
