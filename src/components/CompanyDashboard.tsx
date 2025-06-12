import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
          console.error('Erro ao carregar dados do owner:', error);
        }
      }
      
      // Adicionar colaboradores
      if (agencyData.colaboradores && typeof agencyData.colaboradores === 'object') {
        for (const [uid, role] of Object.entries(agencyData.colaboradores)) {
          if (uid !== agencyData.ownerUID) {
            try {
              const memberData = await firestoreService.getUserData(uid);
              if (memberData) {
                members.push({
                  uid,
                  email: memberData.email,
                  name: memberData.name || memberData.email.split('@')[0],
                  role: role as string
                });
              }
            } catch (error) {
              console.error(`Erro ao carregar dados do colaborador ${uid}:`, error);
              members.push({
                uid,
                email: 'Email não disponível',
                name: 'Nome não disponível',
                role: role as string
              });
            }
          }
        }
      }
      setTeamMembers(members);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
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
    if (!inviteEmail.trim() || !agencyData) {
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
      const isAlreadyMember = teamMembers.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase());
      if (isAlreadyMember) {
        toast({
          title: "Erro",
          description: "Este usuário já é membro da equipe",
          variant: "destructive"
        });
        setIsAddingMember(false);
        return;
      }

    const userBasic = await firestoreService.getUserByEmail(inviteEmail) as { id: string; name?: string; email?: string };
    if (!userBasic) {
      toast({
        title: "Usuário não encontrado",
        description: "Esse e-mail ainda não está cadastrado na plataforma.",
        variant: "destructive"
      });
      setIsAddingMember(false);
      return;
    }

    await firestoreService.addCompanyMember(agencyData.id, userBasic.id, inviteRole);
    setInviteEmail('');
    setInviteRole('viewer');
    await loadCompanyData();

    const displayName = (userBasic && userBasic.name?.trim()) || (userBasic && userBasic.email?.split('@')[0]) || 'Usuário';

    toast({
      title: "Sucesso",
      description: `${displayName} foi adicionado como ${getRoleLabel(inviteRole)}!`
    });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro. Verifique as permissões.",
        variant: "destructive"
      });
    } finally {
      setIsAddingMember(false);
    }
  };

const handleRemoveMember = (uid: string) => {
  if (!canRemoveMembers(currentUserRole, teamMembers.find(m => m.uid === uid)?.role || '')) {
    alert("Sem permissão para remover esse membro.");
    return;
  }
  setTeamMembers(prev => prev.filter(m => m.uid !== uid));
};

const handleEditRole = (uid: string, newRole: string) => {
  if (currentUserRole !== 'owner') {
    alert("Sem permissão para editar cargos.");
    return;
  }
  setTeamMembers(prev => prev.map(m => m.uid === uid ? { ...m, role: newRole } : m));
};

// Removed duplicate handleRemoveMember definition to fix redeclaration error.


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

  const canManageMembers = (userRole: string) => userRole === 'owner';
  const canRemoveMembers = (userRole: string, targetRole: string) => userRole === 'owner' && targetRole !== 'owner';

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
            <p className="text-sm font-medium mt-1">Seu Papel</p>
            <p className="text-lg">{getRoleLabel(currentUserRole)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Badge variant={agencyData.status === 'active' ? 'default' : 'destructive'}>
              {agencyData.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
            <p className="mt-1 text-sm text-gray-600">Status da Empresa</p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para adicionar membro */}
      {canManageMembers(currentUserRole) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Adicionar Membro
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <Input
              type="email"
              placeholder="Email do novo membro"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1"
              disabled={isAddingMember}
            />
            <Select
              value={inviteRole}
              onValueChange={setInviteRole}
              disabled={isAddingMember}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMemberDirect}
              disabled={isAddingMember}
              className="whitespace-nowrap"
            >
              {isAddingMember ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 && (
            <p className="text-gray-600 text-center py-8">Nenhum membro encontrado.</p>
          )}

          <div className="space-y-4">
            {teamMembers.map(member => (
              <div
                key={member.uid}
                className="flex items-center justify-between border rounded-md p-3 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {getRoleIcon(member.role)}
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="uppercase tracking-wider px-3 py-1">
                    {getRoleLabel(member.role)}
                  </Badge>
<select
  value={member.role}
  onChange={e => handleEditRole(member.uid, e.target.value)}
  disabled={currentUserRole !== 'owner'}
>
  <option value="viewer">Viewer</option>
  <option value="editor">Editor</option>
  <option value="owner">Owner</option>
</select>

                  {canRemoveMembers(currentUserRole, member.role) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.uid, member.name)}
                      title="Remover membro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
