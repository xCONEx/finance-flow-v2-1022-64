
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (project: Project) => void;
}

const ProjectDetailsModal = ({ isOpen, onClose, project, onSave }: ProjectDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Project | null>(null);
  const [linkInput, setLinkInput] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({ ...project });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      setIsEditing(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setLinkInput("");
    onClose();
  };

  const addLink = () => {
    if (linkInput.trim() && formData) {
      setFormData(prev => prev ? ({
        ...prev,
        links: [...(prev.links || []), linkInput.trim()]
      }) : null);
      setLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    if (formData) {
      setFormData(prev => prev ? ({
        ...prev,
        links: prev.links?.filter((_, i) => i !== index) || []
      }) : null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500";
      case "media": return "bg-yellow-500";
      case "baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "filmado": return "Filmado";
      case "edicao": return "Em Edição";
      case "revisao": return "Revisão";
      case "entregue": return "Entregue";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (!project || !formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Editar Projeto" : "Detalhes do Projeto"}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                className={`text-white ${getPriorityColor(formData.priority)}`}
              >
                {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
              </Badge>
              <Badge variant="outline">
                {getStatusLabel(formData.status)}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Projeto</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, client: e.target.value }) : null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Entrega</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, dueDate: e.target.value }) : null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "baixa" | "media" | "alta") => 
                  setFormData(prev => prev ? ({ ...prev, priority: value }) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "filmado" | "edicao" | "revisao" | "entregue") => 
                  setFormData(prev => prev ? ({ ...prev, status: value }) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filmado">Filmado</SelectItem>
                  <SelectItem value="edicao">Em Edição</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Links de Entrega</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Cole o link aqui"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                />
                <Button type="button" onClick={addLink}>
                  Adicionar
                </Button>
              </div>
              
              {formData.links && formData.links.length > 0 && (
                <div className="space-y-1">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">{link}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLink(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-brand-gray">Cliente</Label>
                <p className="text-brand-black">{formData.client}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-brand-gray">Data de Entrega</Label>
                <p className="text-brand-black">{formatDate(formData.dueDate)}</p>
              </div>
            </div>

            {formData.description && (
              <div>
                <Label className="text-sm font-medium text-brand-gray">Descrição</Label>
                <p className="text-brand-black mt-1">{formData.description}</p>
              </div>
            )}

            {formData.links && formData.links.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-brand-gray">Links de Entrega</Label>
                <div className="space-y-2 mt-2">
                  {formData.links.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Link {index + 1}: {link}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Editar Projeto
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
