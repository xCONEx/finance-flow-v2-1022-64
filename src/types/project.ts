
export interface Project {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "baixa" | "media" | "alta";
  description?: string;
  links?: string[];
  status: "filmado" | "edicao" | "revisao" | "entregue";
  createdAt: string;
  updatedAt: string;
  companyId?: string;
  userId: string;
  assignedTo?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatar?: string;
  companyId: string;
  createdAt: string;
}
