
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Mail, 
  Plus, 
  Building2,
  Crown,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Usuário atual:', user);
  }, [user]);

  useEffect(() => {
    loadCompanyData();
  }, [agencyData]);

  // Função para verificar se o usuário é o proprietário da agência (autorizado)
  const isAuthorizedAgency = () => {
    if (!agencyData) {
      console.warn('agencyData está undefined');
      return false;
    }
    if (!user) {
      console.warn('user está undefined');
      return false;
    }
    const userId = user.id; // Using id instead of uid
    console.log('Comparando ownerUID:', agencyData.ownerUID, 'com userId:', userId);
    return agencyData.ownerUID === userId;
  };

  // Você pode usar isso para controlar quem pode convidar ou remover membros
  const isOwner = isAuthorizedAgency();

  const loadCompanyData = async () => {
    if (!agencyData) return;
    
    try {
      console.log('Carregando dados da empresa...');
      
      // Use members or collaborators (for backward compatibility)
      const members = agencyData.members || agencyData.collaborators || [];
      const memberDetails = await Promise.all(
        members.map(async (uid) => {
          const userData = await firestoreService.getUserData(uid);
          return {
            uid: uid,
            name: userData?.name || userData?.email?.split('@')[0] || 'Usuário',
            email: userData?.email || '',
            role: 'employee'
          };
        })
      );

      if (agencyData.ownerUID) {
        const ownerData = await firestoreService.getUserData(agencyData.ownerUID);
        if (ownerData) {
          memberDetails.unshift({
            uid: agencyData.ownerUID,
            name: ownerData.name || ownerData.email?.split('@')[0] || 'Proprietário',
            email: ownerData.email || '',
            role: 'owner'
          });
        }
      }

      setTeamMembers(memberDetails);

      const invites = await firestoreService.getCompanyInvites(agencyData.id);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !agencyData) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Enviando convite para:', inviteEmail);
      
      const inviteData = {
        email: inviteEmail,
        companyId: agencyData.id,
        companyName: agencyData.name || 'Empresa',
        invitedBy: user?.email,
        role: inviteRole,
        status: 'pending'
      };

      await firestoreService.sendInvite(inviteData);
      
      setInviteEmail('');
      await loadCompanyData();

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      console.log('Removendo membro:', memberId);
      
      await firestoreService.removeCompanyMember(agencyData.id, memberId);
      await loadCompanyData();
      
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Building2 className="text-purple-600" />
          {agencyData?.name || 'Sua Empresa'}
        </h2>
        <p className="text-gray-600">Gestão de equipe e colaboradores</p>
      </div>

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
            <Crown className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm font-medium">{isOwner ? 'Proprietário' : 'Colaborador'}</p>
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
              {isOwner && (
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
                      <Button onClick={handleSendInvite} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Convite
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {member.role === 'owner' ? 'Proprietário' : 'Colaborador'}
                        </Badge>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    </div>
                    {isOwner && member.role !== 'owner' && (
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
                        <p className="text-sm text-gray-600">
                          Enviado em {invite.sentAt ? new Date(invite.sentAt.toDate()).toLocaleDateString() : 'Data não disponível'}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {invite.status === 'pending' ? 'Aguardando' : invite.status}
                        </Badge>
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
