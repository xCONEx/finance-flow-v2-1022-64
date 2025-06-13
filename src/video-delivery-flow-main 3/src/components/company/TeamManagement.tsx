
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2 } from "lucide-react";
import { teamService } from '../../services/teamService';
import { TeamMember } from '../../types/project';

interface TeamManagementProps {
  agencyId?: string;
}

const TeamManagement = ({ agencyId }: TeamManagementProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  useEffect(() => {
    loadTeamMembers();
  }, [agencyId]);

  const loadTeamMembers = async () => {
    if (!agencyId) return;
    
    try {
      const members = await teamService.getCompanyTeam(agencyId);
      setTeamMembers(members);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !agencyId) return;
    
    try {
      await teamService.addTeamMember({
        name: newMemberEmail.split('@')[0],
        email: newMemberEmail,
        role: newMemberRole,
        agencyId
      });
      
      setNewMemberEmail('');
      setNewMemberRole('viewer');
      await loadTeamMembers();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamService.removeTeamMember(memberId);
      await loadTeamMembers();
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email do novo membro"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newMemberRole} onValueChange={(value: 'admin' | 'editor' | 'viewer') => setNewMemberRole(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe ({teamMembers.length})</CardTitle>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{member.role}</span>
                    <Button
                      variant="destructive"
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
    </div>
  );
};

export default TeamManagement;
