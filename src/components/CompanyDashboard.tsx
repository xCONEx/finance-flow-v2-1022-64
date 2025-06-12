
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Building2,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  Search,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAgency } from '../hooks/useAgency';
import { usePermissions } from '../hooks/usePermissions';
import { agencyService } from '../services/agencyService';
import { firestoreService } from '../services/firestore';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const { agencyData, isLoading, refetch } = useAgency();
  const permissions = usePermissions(agencyData?.userRole || 'viewer');
  const { toast } = useToast();

  React.useEffect(() => {
    if (agencyData?.id && agencyData.id !== 'admin') {
      loadTeamMembers();
    }
  }, [agencyData]);

  const loadTeamMembers = async () => {
    if (!agencyData?.id || agencyData.id === 'admin') return;
    
    try {
      const members = await agencyService.getAgencyMembers(agencyData.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('❌ Erro ao carregar membros:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da equipe",
        variant: "destructive"
      });
    }
  };

  const handleAddMember = async () => {
    if (!inviteEmail.trim() || !agencyData?.id) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMember(true);

    try {
      // Verificar se usuário já é membro
      const isAlreadyMember = teamMembers.some(m => 
        m.email?.toLowerCase() === inviteEmail.toLowerCase()
      );
      
      if (isAlreadyMember) {
        toast({
          title: "Erro",
          description: "Este usuário já é membro da equipe",
          variant: "destructive"
        });
        return;
      }

      // Buscar usuário por email
      const userBasic = await firestoreService.getUserByEmail(inviteEmail);
      if (!userBasic) {
        toast({
          title: "Usuário não encontrado",
          description: "Esse e-mail ainda não está cadastrado na plataforma.",
          variant: "destructive"
        });
        return;
      }

      // Adicionar membro usando novo service
      await agencyService.addMember(agencyData.id, userBasic.id, inviteEmail, inviteRole);
      
      // Recarregar dados
      await loadTeamMembers();
      
      // Limpar formulário
      setInviteEmail('');
      setInviteRole('viewer');
      setShowAddModal(false);

      toast({
        title: "Sucesso",
        description: `${userBasic.name || userBasic.email} foi adicionado como ${getRoleLabel(inviteRole)}!`
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

  const handleRemoveMember = async (uid: string, memberName: string) => {
    if (!permissions.canManageTeam) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para remover membros.",
        variant: "destructive"
      });
      return;
    }

    try {
      await agencyService.removeMember(agencyData!.id, uid);
      await loadTeamMembers();
      
      toast({
        title: "Membro removido",
        description: `${memberName} foi removido da equipe.`
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

  const handleEditRole = async (uid: string, newRole: 'editor' | 'viewer') => {
    if (!permissions.canManageTeam) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para editar cargos.",
        variant: "destructive"
      });
      return;
    }

    try {
      await agencyService.updateMemberRole(agencyData!.id, uid, newRole);
      await loadTeamMembers();
      setEditingMember(null);
      
      toast({
        title: "Cargo atualizado",
        description: `Cargo atualizado para ${getRoleLabel(newRole)}.`
      });
    } catch (error) {
      console.error('❌ Erro ao editar cargo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cargo",
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
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!agencyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              Você precisa fazer parte de uma agência para acessar esta seção.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da agência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {agencyData?.name || 'Sua Agência'}
              </h1>
              <p className="text-gray-600">Gestão de equipe e colaboradores</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-900">{teamMembers.length}</p>
              <p className="text-sm text-blue-700">Membros da Equipe</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                {getRoleIcon(agencyData.userRole)}
              </div>
              <p className="text-lg font-semibold text-green-900">
                {getRoleLabel(agencyData.userRole)}
              </p>
              <p className="text-sm text-green-700">Seu Papel</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">
                Ativa
              </Badge>
              <p className="text-sm text-purple-700 mt-2">Status da Agência</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Member Section */}
        {permissions.canManageTeam && agencyData.id !== 'admin' && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Gerenciar Equipe
                </CardTitle>
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Membro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email do colaborador
                        </label>
                        <Input
                          type="email"
                          placeholder="exemplo@agencia.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          disabled={isAddingMember}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Cargo
                        </label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}
                          disabled={isAddingMember}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleAddMember}
                          disabled={isAddingMember}
                          className="flex-1"
                        >
                          {isAddingMember ? 'Adicionando...' : 'Adicionar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddModal(false)}
                          disabled={isAddingMember}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Team Members */}
        {agencyData.id !== 'admin' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Equipe ({filteredMembers.length})
                </CardTitle>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar membros..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 && !searchTerm && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum membro encontrado.</p>
                </div>
              )}

              {filteredMembers.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum membro encontrado para "{searchTerm}".</p>
                </div>
              )}

              <div className="space-y-3">
                {filteredMembers.map(member => (
                  <div
                    key={member.uid}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      {editingMember === member.uid ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(newRole: 'editor' | 'viewer') => handleEditRole(member.uid, newRole)}
                            disabled={!permissions.canManageTeam}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              {member.role === 'owner' && (
                                <SelectItem value="owner">Proprietário</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMember(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge className={`${getRoleBadgeColor(member.role)} border`}>
                            {getRoleLabel(member.role)}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            {permissions.canManageTeam && member.role !== 'owner' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingMember(member.uid)}
                                title="Editar cargo"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {permissions.canManageTeam && member.role !== 'owner' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveMember(member.uid, member.name || '')}
                                title="Remover membro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
