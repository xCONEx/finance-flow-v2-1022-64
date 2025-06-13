
import { useState } from "react";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import KanbanBoard from "@/components/KanbanBoard";
import CompanyDashboard from "@/components/company/CompanyDashboard";

interface Project {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "baixa" | "media" | "alta";
  description?: string;
  links?: string[];
  status: "filmado" | "edicao" | "revisao" | "entregue";
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Assuming you have these from your auth context
  // const { user, agencyData } = useAuth();

  // Mock data for demonstration - replace with your actual auth data
  const user = { userType: 'company_owner' };
  const agencyData = { 
    id: 'company-123', 
    name: 'Sua Empresa',
    userRole: 'owner' 
  };

  const isCompanyUser = user?.userType === 'company_owner' || user?.userType === 'employee' || agencyData;
  const isOwner = agencyData?.userRole === 'owner';
  const isAdmin = user?.userType === 'admin' || agencyData?.userRole === 'admin';

  // Estado inicial dos projetos (em produção virá do banco de dados)
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Vídeo Institucional - TechCorp",
      client: "TechCorp Ltda",
      dueDate: "2024-06-20",
      priority: "alta",
      description: "Vídeo institucional para lançamento de produto",
      status: "filmado"
    },
    {
      id: "2",
      title: "Casamento Sara & João",
      client: "Sara Silva",
      dueDate: "2024-06-25",
      priority: "media",
      status: "filmado"
    },
    {
      id: "3",
      title: "Comercial - Café Premium",
      client: "Café Premium",
      dueDate: "2024-06-18",
      priority: "alta",
      description: "Spot de 30s para TV e redes sociais",
      status: "edicao"
    },
    {
      id: "4",
      title: "Tutorial - App Mobile",
      client: "StartupXYZ",
      dueDate: "2024-06-22",
      priority: "media",
      links: ["https://wetransfer.com/example"],
      status: "revisao"
    },
    {
      id: "5",
      title: "Evento Corporativo",
      client: "Empresa ABC",
      dueDate: "2024-06-15",
      priority: "baixa",
      links: ["https://drive.google.com/example", "https://wetransfer.com/example2"],
      status: "entregue"
    }
  ]);

  const handleAddProject = (projectData: Omit<Project, 'id' | 'status'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      status: "filmado" // Novos projetos começam como "filmado"
    };
    
    setProjects(prev => [...prev, newProject]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50">
            <Header onAddProject={handleAddProject} />
            
            <main className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="px-6 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-brand-black mb-2">
                    Bem-vindo ao EntregaFlow! 🎬
                  </h1>
                  <p className="text-brand-gray">
                    Gerencie seus projetos audiovisuais de forma simples e eficiente
                  </p>
                </div>
                
                {/* Stats Cards */}
                <StatsCards projects={projects} />
              </div>

              {/* Kanban Board */}
              <div className="bg-white rounded-t-3xl shadow-lg min-h-[600px]">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-brand-black">
                    Pipeline de Projetos
                  </h2>
                  <p className="text-sm text-brand-gray mt-1">
                    Arraste e solte os cards para atualizar o status dos projetos
                  </p>
                </div>
                
                <KanbanBoard />
              </div>
            </main>
          </div>
        );
      case 'calculator':
        return <div>Calculator Component</div>; // Replace with your PricingCalculator component
      case 'kanban':
        return isCompanyUser ? (
          <CompanyDashboard 
            companyId={agencyData?.id || 'default-company'} 
            companyName={agencyData?.name}
          />
        ) : (
          <div>Dashboard Component</div>
        );
      case 'costs':
        return <div>Monthly Costs Component</div>; // Replace with your MonthlyCosts component
      case 'items':
        return <div>Work Items Component</div>; // Replace with your WorkItems component
      case 'routine':
        return <div>Work Routine Component</div>; // Replace with your WorkRoutine component
      case 'team':
        return isOwner ? (
          <CompanyDashboard 
            companyId={agencyData?.id || 'default-company'} 
            companyName={agencyData?.name}
          />
        ) : (
          <div>Dashboard Component</div>
        );
      case 'admin':
        return isAdmin ? <div>Admin Panel Component</div> : <div>Dashboard Component</div>; // Replace with your AdminPanel component
      case 'settings':
        return <div>Settings Component</div>; // Replace with your Settings component
      case 'profile':
        return <div>User Profile Component</div>; // Replace with your UserProfile component
      case 'subscription':
        return <div>Subscription Plans Component</div>; // Replace with your SubscriptionPlans component
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-50">
            <Header onAddProject={handleAddProject} />
            
            <main className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="px-6 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-brand-black mb-2">
                    Bem-vindo ao EntregaFlow! 🎬
                  </h1>
                  <p className="text-brand-gray">
                    Gerencie seus projetos audiovisuais de forma simples e eficiente
                  </p>
                </div>
                
                {/* Stats Cards */}
                <StatsCards projects={projects} />
              </div>

              {/* Kanban Board */}
              <div className="bg-white rounded-t-3xl shadow-lg min-h-[600px]">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-brand-black">
                    Pipeline de Projetos
                  </h2>
                  <p className="text-sm text-brand-gray mt-1">
                    Arraste e solte os cards para atualizar o status dos projetos
                  </p>
                </div>
                
                <KanbanBoard />
              </div>
            </main>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Replace Navigation component with your actual Navigation */}
      {/* 
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        showTeamOption={isOwner}
      />
      */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
