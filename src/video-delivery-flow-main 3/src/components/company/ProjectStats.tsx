
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { Project } from "@/types/project";

interface ProjectStatsProps {
  projects: Project[];
}

const ProjectStats = ({ projects }: ProjectStatsProps) => {
  const activeProjects = projects.filter(p => p.status !== "entregue").length;
  
  const deliveredThisMonth = projects.filter(p => {
    if (p.status !== "entregue") return false;
    const dueDate = new Date(p.dueDate);
    const now = new Date();
    return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
  }).length;
  
  const urgentProjects = projects.filter(p => {
    if (p.status === "entregue") return false;
    const dueDate = new Date(p.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  }).length;
  
  const nextDelivery = projects
    .filter(p => p.status !== "entregue")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  const getNextDeliveryDays = () => {
    if (!nextDelivery) return "Nenhum";
    const dueDate = new Date(nextDelivery.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Atrasado";
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return `${diffDays} dias`;
  };

  const totalProjects = projects.length;
  const completionRate = totalProjects > 0 ? Math.round((projects.filter(p => p.status === "entregue").length / totalProjects) * 100) : 0;

  const stats = [
    {
      title: "Projetos Ativos",
      value: activeProjects.toString(),
      description: "Em andamento",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Entregues este mês",
      value: deliveredThisMonth.toString(),
      description: "Projetos finalizados",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Prazos Urgentes",
      value: urgentProjects.toString(),
      description: "Vencendo em 2 dias",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      title: "Próxima Entrega",
      value: getNextDeliveryDays(),
      description: nextDelivery ? nextDelivery.title : "Nenhum projeto pendente",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Taxa de Conclusão",
      value: `${completionRate}%`,
      description: `${projects.filter(p => p.status === "entregue").length} de ${totalProjects} projetos`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Projetos</h2>
        <p className="text-gray-600">Acompanhe o progresso dos seus projetos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 mt-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto ainda</h3>
          <p className="text-gray-600">Comece criando seu primeiro projeto no kanban</p>
        </div>
      )}
    </div>
  );
};

export default ProjectStats;
