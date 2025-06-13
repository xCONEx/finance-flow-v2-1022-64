
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { teamService } from '../../services/teamService';
import { TeamMember } from '../../types/project';

interface TeamManagementProps {
  agencyId: string;
}

const TeamManagement = ({ agencyId }: TeamManagementProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'editor' as TeamMember['role']
  });

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (agencyId) {
        try {
          const members = await teamService.getCompanyTeam(agencyId);
          setTeamMembers(members);
        } catch (error) {
          console.error('Erro ao carregar equipe:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTeamMembers();
  }, [agencyId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const memberId = await teamService.addTeamMember({
        ...formData,
        agencyId
      });
      
      const newMember: TeamMember = {
        id: memberId,
        ...formData,
        agencyId,
        createdAt: new Date().toISOString()
      };
      
      setTeamMembers(prev => [newMember, ...prev]);
      setFormData({ name: '', email: '', role: 'editor' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamService.removeTeamMember(memberId);
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando equipe...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum membro encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium capitalize">{member.role}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value: TeamMember['role']) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
