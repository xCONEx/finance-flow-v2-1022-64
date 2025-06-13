
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Settings, BarChart3 } from "lucide-react";
import { teamService } from '../../services/teamService';
import { TeamMember } from '../../types/project';
import ProjectKanban from './ProjectKanban';
import TeamManagement from './TeamManagement';

interface CompanyDashboardProps {
  agencyId?: string;
  companyName?: string;
}

const CompanyDashboard = ({ agencyId, companyName }: CompanyDashboardProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'team'>('overview');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectKanban agencyId={agencyId} />;
      case 'team':
        return <TeamManagement agencyId={agencyId} />;
      default:
        return (
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
        );
    }
  };

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

      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'projects' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projetos
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'team' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Equipe
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default CompanyDashboard;
