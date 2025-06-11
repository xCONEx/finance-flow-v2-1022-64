
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
  Send,
  Shield,
  Eye,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyData();
  }, [agencyData]);

  const loadCompanyData = async () => {
    if (!agencyData) return;
    
    try {
      console.log('Carregando dados da empresa...');
      
      // Carregar membros da equipe (nova estrutura com roles)
      const members = [];
      
      // Adicionar owner
      if (agencyData.ownerUID) {
        const ownerData = await firestoreService.getUserData(agencyData.ownerUID);
        if (ownerData) {
          members.push({
            uid: agencyData.ownerUID,
            email: ownerData.email,
            name: ownerData.name || ownerData.email.split('@')[0],
            role: 'owner'
          });
        }
      }
      
      // Adicionar colaboradores com suas roles
      if (agencyData.colaboradores && typeof agencyData.colaboradores === 'object') {
        for (const [uid, role] of Object.entries(agencyData.colaboradores)) {
          const memberData = await firestoreService.getUserData(uid);
          if (memberData) {
            members.push({
              uid: uid,
              email: memberData.email,
              name: memberData.name || memberData.email.split('@')[0],
              role: role
            });
          }
        }
      }
      
      setTeamMembers(members);

      // Carregar convites pendentes
      const invites = await firestoreService.getCompanyInvites(agencyData.id);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

 const handleAddMemberDirect = async () => {
  if (!inviteEmail || !agencyData) {
    toast({
      title: "Erro",
      description: "Digite um email válido",
      variant: "destructive"
    });
    return;
  }

  try {
    console.log('🔍 Procurando usuário com e-mail:', inviteEmail);
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

    // Buscar dados completos do usuário para obter o nome
    const userData = await firestoreService.getUserData(userBasic.id);

    await firestoreService.addCompanyMember(agencyData.id, userBasic.id, inviteRole);

    setInviteEmail('');
    setInviteRole('viewer');
    await loadCompanyData();

    const displayName = userData?.name?.trim() || inviteEmail?.trim() || 'Desconhecido';

      toast({
  title: "Sucesso",
  description: `Membro ${displayName} adicionado como ${getRoleLabel(inviteRole)}!`
});

  } catch (error) {
    console.error('❌ Erro ao adicionar membro diretamente:', error);
    toast({
      title: "Erro",
      description: "Erro ao adicionar membro. Verifique as permissões.",
      variant: "destructive"
    });
  }
};


  const handleRemoveMember = async (memberId) => {
    try {
      console.log('Removendo membro:', memberId);
      
      await firestoreService.removeCompanyMember(agencyData.id, memberId);
      await loadCompanyData(); // Recarregar dados
      
      toast({
        title: "Sucesso",
        description: "Membro removido da equipe"
      });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      default: return 'Colaborador';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'editor': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const canInviteMembers = (userRole) => {
    // Apenas owners podem convidar outros membros
    return userRole === 'owner';
  };

  const canRemoveMembers = (userRole, targetRole) => {
    // Apenas owners podem remover membros, e não podem remover outros owners
    return userRole === 'owner' && targetRole !== 'owner';
  };

  // Determinar role do usuário atual
  const currentUserRole = agencyData?.ownerUID === user?.id ? 'owner' : 
    agencyData?.colaboradores?.[user?.id] || 'viewer';

  const isOwner = currentUserRole === 'owner';

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
            <Mail className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{pendingInvites.length}</p>
            <p className="text-sm text-gray-600">Convites Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            {getRoleIcon(currentUserRole)}
            <p className="text-sm font-medium mt-2">{getRoleLabel(currentUserRole)}</p>
            <p className="text-xs text-gray-600">Seu Papel</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Membros da Equipe</CardTitle>
              {canInviteMembers(currentUserRole) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Convidar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar Novo Membro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Email do colaborador"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
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
                      <Button onClick={handleAddMemberDirect} className="w-full">
  <UserCheck className="h-4 w-4 mr-2" />
  Adicionar Membro
</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
  <div className="space-y-4">
    {teamMembers.map((member, index) => (
      <div key={`${member.uid}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h4 className="font-medium">{member.name}</h4>
          <p className="text-sm text-gray-600">{member.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getRoleIcon(member.role)}
              {getRoleLabel(member.role)}
            </Badge>
            <Badge variant="secondary">Ativo</Badge>
          </div>
        </div>
        {canRemoveMembers(currentUserRole, member.role) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveMember(member.uid)}
          >
            Remover
          </Button>
        )}
      </div>
    ))}
  </div>
</CardContent>

          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInvites.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum convite pendente</p>
                  </div>
                ) : (
                  pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{invite.email}</h4>
                        <p className="text-sm text-gray-600">Enviado em {new Date(invite.sentAt?.toDate?.() || invite.sentAt).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getRoleIcon(invite.role)}
                            {getRoleLabel(invite.role)}
                          </Badge>
                          <Badge variant="outline">
                            {invite.status === 'pending' ? 'Aguardando' : invite.status}
                          </Badge>
                        </div>
                      </div>
                      {isOwner && (
                        <Button variant="outline" size="sm">
                          Reenviar
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDashboard;
