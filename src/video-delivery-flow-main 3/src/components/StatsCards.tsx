
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";

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

interface StatsCardsProps {
  projects: Project[];
}

const StatsCards = ({ projects }: StatsCardsProps) => {
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
      color: "text-brand-orange",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-gray">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-black mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-brand-gray line-clamp-2">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
