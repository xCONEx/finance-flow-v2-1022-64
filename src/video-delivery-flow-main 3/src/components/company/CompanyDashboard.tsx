
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, FolderKanban } from "lucide-react";
import ProjectStats from "./ProjectStats";
import ProjectKanban from "./ProjectKanban";
import TeamManagement from "./TeamManagement";
import { projectService } from "../../services/projectService";
import { Project } from "../../types/project";

interface CompanyDashboardProps {
  companyId: string;
  companyName?: string;
}

const CompanyDashboard = ({ companyId, companyName }: CompanyDashboardProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const loadProjects = async () => {
      try {
        const companyProjects = await projectService.getCompanyProjects(companyId);
        setProjects(companyProjects);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // Listener em tempo real para projetos
    const unsubscribe = projectService.subscribeToCompanyProjects(companyId, (updatedProjects) => {
      setProjects(updatedProjects);
    });

    return () => unsubscribe();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {companyName || 'Empresa'} - EntregaFlow
        </h2>
        <p className="text-gray-600">
          Sistema de gestão de projetos audiovisuais
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Projetos
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ProjectStats projects={projects} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectKanban companyId={companyId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamManagement companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDashboard;
