
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Mail, Trash2, Crown, Edit, Eye } from "lucide-react";
import { TeamMember } from "@/types/project";
import { teamService } from "@/services/teamService";
import { useToast } from "@/hooks/use-toast";

interface TeamManagementProps {
  companyId: string;
}

const TeamManagement = ({ companyId }: TeamManagementProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as "admin" | "editor" | "viewer"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTeamMembers();
  }, [companyId]);

  const loadTeamMembers = async () => {
    try {
      const members = await teamService.getCompanyTeam(companyId);
      setTeamMembers(members);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a equipe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await teamService.addTeamMember({
        ...formData,
        companyId
      });
      
      toast({
        title: "Sucesso",
        description: "Membro adicionado à equipe"
      });
      
      setFormData({ name: "", email: "", role: "viewer" });
      setIsAddModalOpen(false);
      loadTeamMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o membro",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamService.removeTeamMember(memberId);
      
      toast({
        title: "Sucesso",
        description: "Membro removido da equipe"
      });
      
      loadTeamMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: TeamMember['role']) => {
    try {
      await teamService.updateTeamMember(memberId, { role: newRole });
      
      toast({
        title: "Sucesso",
        description: "Permissão atualizada"
      });
      
      loadTeamMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4" />;
      case "editor": return <Edit className="w-4 h-4" />;
      case "viewer": return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "editor": return "bg-blue-100 text-blue-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "editor": return "Editor";
      case "viewer": return "Visualizador";
      default: return "Visualizador";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando equipe...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Equipe</h2>
          <p className="text-gray-600">Adicione e gerencie membros da sua equipe</p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permissão:</span>
                  <Badge className={`${getRoleColor(member.role)} flex items-center space-x-1`}>
                    {getRoleIcon(member.role)}
                    <span>{getRoleLabel(member.role)}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Alterar Permissão</Label>
                  <Select
                    value={member.role}
                    onValueChange={(newRole: TeamMember['role']) => handleUpdateRole(member.id, newRole)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro na equipe</h3>
          <p className="text-gray-600 mb-4">Comece adicionando membros à sua equipe</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Adicionar Primeiro Membro
          </Button>
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "editor" | "viewer") => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Administrador:</strong> Acesso total ao sistema</p>
              <p><strong>Editor:</strong> Pode criar e editar projetos</p>
              <p><strong>Visualizador:</strong> Apenas visualizar projetos</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Membro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
