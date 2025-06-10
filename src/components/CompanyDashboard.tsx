
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
  UserCheck, 
  Building2,
  Crown,
  Send,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const { user, companyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyData();
  }, [companyData]);

  const loadCompanyData = async () => {
    if (!companyData) return;
    
    try {
      console.log('Carregando dados da empresa...');
      
      // Carregar membros da equipe
      const members = companyData.collaborators || [];
      setTeamMembers(members);

      // Carregar convites pendentes
      const invites = await firestoreService.getCompanyInvites(companyData.id);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !companyData) {
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
        companyId: companyData.id,
        companyName: companyData.name || 'Empresa',
        invitedBy: user?.email,
        role: 'company_colab',
        status: 'pending'
      };

      await firestoreService.sendCompanyInvite(inviteData);
      
      setInviteEmail('');
      await loadCompanyData(); // Recarregar dados

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

  const handleRemoveMember = async (memberUid: string) => {
    try {
      console.log('Removendo membro:', memberUid);
      
      await firestoreService.removeCollaboratorFromCompany(companyData.id, memberUid);
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

  const isOwner = user?.userType === 'company_owner';
  const isCollaborator = user?.userType === 'company_colab';
  const isAdmin = user?.userType === 'admin';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Building2 className="text-purple-600" />
          {companyData?.name || 'Sua Empresa'}
        </h2>
        <p className="text-gray-600">Gestão de equipe e colaboradores</p>
        
        {!isOwner && !isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                Você é colaborador desta empresa. Acesso limitado disponível.
              </span>
            </div>
          </div>
        )}
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
            <Crown className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm font-medium">
              {isOwner ? 'Proprietário' : isCollaborator ? 'Colaborador' : 'Admin'}
            </p>
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
              {(isOwner || isAdmin) && (
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
                {/* Mostrar owner primeiro - CORRIGIDO: usar ownerUid */}
                {companyData?.ownerUid && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                    <div>
                      <h4 className="font-medium">Proprietário</h4>
                      <p className="text-sm text-gray-600">{companyData.ownerUid}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="default">Proprietário</Badge>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mostrar colaboradores */}
                {teamMembers.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{member.name || member.email}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">Colaborador</Badge>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    </div>
                    {(isOwner || isAdmin) && (
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
                      {(isOwner || isAdmin) && (
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
