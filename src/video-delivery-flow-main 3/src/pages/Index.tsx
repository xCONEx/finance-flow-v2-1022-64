
import React, { useState } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import CompanyDashboard from '../components/company/CompanyDashboard';
import { Project } from '../types/project';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock data for projects
  const [projects] = useState<Project[]>([
    {
      id: '1',
      title: 'Projeto Video Marketing',
      client: 'Cliente A',
      dueDate: '2024-12-31',
      priority: 'alta' as const,
      status: 'filmado' as const,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      agencyId: 'agency1'
    }
  ]);

  // Mock agency data
  const mockAgencyData = {
    id: 'agency1',
    name: 'Minha Agência'
  };

  const handleProjectMove = async (projectId: string, newStatus: string) => {
    console.log('Moving project', projectId, 'to', newStatus);
    // Here you would typically update the project status
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="text-gray-600">Bem-vindo ao sistema de gestão de projetos audiovisuais.</div>
          </div>
        );
      case 'kanban':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Kanban de Projetos</h1>
            <KanbanBoard 
              projects={projects} 
              onProjectMove={handleProjectMove}
            />
          </div>
        );
      case 'team':
        return <CompanyDashboard agencyId={mockAgencyData.id} />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="text-gray-600">Bem-vindo ao sistema de gestão de projetos audiovisuais.</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">EntregaFlow</h1>
            </div>
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'kanban'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'team'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Equipe
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
