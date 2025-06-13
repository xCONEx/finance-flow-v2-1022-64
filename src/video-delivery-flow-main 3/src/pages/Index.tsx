
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import KanbanBoard from '../components/KanbanBoard';
import CompanyDashboard from '../components/company/CompanyDashboard';
import { Project } from '../types/project';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);

  // Mock user and agency data for now
  const user = { userType: 'company_owner' };
  const agencyData = { 
    id: 'mock-agency-id',
    name: 'Mock Agency',
    userRole: 'owner'
  };

  const isCompanyUser = user?.userType === 'company_owner' || user?.userType === 'employee' || agencyData;
  const isOwner = agencyData?.userRole === 'owner';
  const isAdmin = user?.userType === 'admin' || agencyData?.userRole === 'admin';

  const handleProjectMove = async (projectId: string, newStatus: string) => {
    console.log('Moving project:', projectId, 'to status:', newStatus);
    // Implementation would go here
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Welcome to the dashboard!</p>
          </div>
        );
      case 'calculator':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Calculadora</h1>
            <p>Pricing calculator coming soon...</p>
          </div>
        );
      case 'kanban':
        return isCompanyUser ? (
          <KanbanBoard 
            projects={projects}
            onProjectMove={handleProjectMove}
          />
        ) : (
          <div>Access denied</div>
        );
      case 'costs':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Custos Mensais</h1>
            <p>Monthly costs coming soon...</p>
          </div>
        );
      case 'items':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Itens de Trabalho</h1>
            <p>Work items coming soon...</p>
          </div>
        );
      case 'routine':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Rotina de Trabalho</h1>
            <p>Work routine coming soon...</p>
          </div>
        );
      case 'team':
        return isOwner ? (
          <CompanyDashboard 
            agencyId={agencyData.id}
            agencyName={agencyData.name}
          />
        ) : (
          <div>Access denied</div>
        );
      case 'admin':
        return isAdmin ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <p>Admin panel coming soon...</p>
          </div>
        ) : (
          <div>Access denied</div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p>Settings coming soon...</p>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
            <p>User profile coming soon...</p>
          </div>
        );
      case 'subscription':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Planos de Assinatura</h1>
            <p>Subscription plans coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Welcome to the dashboard!</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Simple navigation for now */}
      <nav className="bg-white border-b border-gray-200 p-4">
        <div className="flex space-x-4">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'calculator' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('calculator')}
          >
            Calculator
          </Button>
          <Button 
            variant={activeTab === 'kanban' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('kanban')}
          >
            Kanban
          </Button>
          <Button 
            variant={activeTab === 'team' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('team')}
          >
            Team
          </Button>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
