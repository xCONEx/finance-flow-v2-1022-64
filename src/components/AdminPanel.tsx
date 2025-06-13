
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  BarChart3, 
  UserPlus, 
  Shield, 
  DollarSign,
  CheckCircle,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firestoreService } from '../services/firestore';
import { formatCurrency } from '../utils/formatters';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do painel admin...');
      
      const [usersData, analyticsData] = await Promise.all([
        firestoreService.getAllUsers(),
        firestoreService.getAnalyticsData()
      ]);
      
      setUsers(usersData);
      setAnalytics(analyticsData);
      
      console.log('Dados carregados:', { 
        users: usersData.length, 
        analytics: !!analyticsData 
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserType = async (userId, newUserType) => {
    try {
      console.log('Atualizando tipo de usuário:', userId, newUserType);
      await firestoreService.updateUserField(userId, 'userType', newUserType);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, userType: newUserType } : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Tipo de usuário atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar tipo de usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de usuário",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSubscription = async (userId, newPlan) => {
    try {
      console.log('Atualizando plano do usuário:', userId, newPlan);
      await firestoreService.updateUserField(userId, 'subscription', newPlan);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, subscription: newPlan } : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive"
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adicionando administrador:', newAdminEmail);
      
      const user = users.find(u => u.email === newAdminEmail);
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }
      
      await firestoreService.updateUserField(user.id, 'userType', 'admin');
      
      toast({
        title: "Sucesso",
        description: "Administrador adicionado com sucesso"
      });
      
      setNewAdminEmail('');
      await loadData();
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar administrador",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas de usuários por plano
  const freeUsers = users.filter(u => !u.subscription || u.subscription === 'free').length;
  const premiumUsers = users.filter(u => u.subscription === 'premium').length;
  const enterpriseUsers = users.filter(u => u.subscription === 'enterprise').length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600" />
          Painel Administrativo
        </h2>
        <p className="text-gray-600">Gestão completa da plataforma FinanceFlow</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
            <p className="text-sm text-gray-600">Usuários Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{premiumUsers}</p>
            <p className="text-sm text-gray-600">Premium</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{enterpriseUsers}</p>
            <p className="text-sm text-gray-600">Enterprise</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{analytics?.overview?.activeUsers || 0}</p>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.email}</h4>
                      <p className="text-sm text-gray-600">UID: {user.uid}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{user.subscription || 'free'}</Badge>
                        <Badge variant="outline">{user.userType || 'individual'}</Badge>
                        {user.companyId && (
                          <Badge variant="secondary">Empresa: {user.companyName || user.companyId}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Select onValueChange={(value) => handleUpdateSubscription(user.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select onValueChange={(value) => handleUpdateUserType(user.id, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Email do novo administrador"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                  <Button onClick={handleAddAdmin}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Admin
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Administradores Atuais</h4>
                  <div className="space-y-2">
                    {users.filter(user => user.userType === 'admin').map(admin => (
                      <div key={admin.id} className="flex items-center justify-between">
                        <span>{admin.email}</span>
                        <Badge>Admin</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usuários Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-600">{freeUsers}</p>
                  <p className="text-sm text-gray-500">Plano gratuito</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usuários Premium</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{premiumUsers}</p>
                  <p className="text-sm text-gray-500">Plano premium</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usuários Enterprise</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">{enterpriseUsers}</p>
                  <p className="text-sm text-gray-500">Plano empresarial</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
