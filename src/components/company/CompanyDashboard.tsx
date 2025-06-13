
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Settings, BarChart3 } from "lucide-react";
import { teamService } from '../../services/teamService';
import { TeamMember } from '../../types/project';

interface CompanyDashboardProps {
  agencyId?: string;
  companyName?: string;
}

const CompanyDashboard = ({ agencyId, companyName }: CompanyDashboardProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard da Empresa {companyName && `- ${companyName}`}
        </h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              Gerenciar
            </Button>
          </CardContent>
        </Card>
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
                  <div className="text-sm font-medium capitalize">{member.role}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
