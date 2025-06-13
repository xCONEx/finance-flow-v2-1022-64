
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Video } from "lucide-react";

interface StatsCardsProps {
  projects?: any[];
}

const StatsCards = ({ projects = [] }: StatsCardsProps) => {
  const filmadoCount = projects.filter(p => p.status === 'filmado').length;
  const edicaoCount = projects.filter(p => p.status === 'edicao').length;
  const revisaoCount = projects.filter(p => p.status === 'revisao').length;
  const entregueCount = projects.filter(p => p.status === 'entregue').length;

  const stats = [
    {
      title: "Filmado",
      count: filmadoCount,
      icon: Video,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Em Edição",
      count: edicaoCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Revisão",
      count: revisaoCount,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Entregue",
      count: entregueCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.count}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
