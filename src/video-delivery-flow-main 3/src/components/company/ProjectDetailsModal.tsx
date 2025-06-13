
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project } from "@/types/project";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (project: Project) => void;
}

const ProjectDetailsModal = ({ isOpen, onClose, project, onSave }: ProjectDetailsModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    dueDate: "",
    priority: "media" as "baixa" | "media" | "alta",
    description: "",
    links: [] as string[],
    status: "filmado" as "filmado" | "edicao" | "revisao" | "entregue"
  });

  const [linkInput, setLinkInput] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        client: project.client,
        dueDate: project.dueDate,
        priority: project.priority,
        description: project.description || "",
        links: project.links || [],
        status: project.status
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      onSave({
        ...project,
        ...formData
      });
    }
  };

  const handleClose = () => {
    setLinkInput("");
    onClose();
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, linkInput.trim()]
      }));
      setLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Projeto</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Entrega</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "filmado" | "edicao" | "revisao" | "entregue") => 
                setFormData(prev => ({ ...prev, status: value }))
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
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: "baixa" | "media" | "alta") => 
                setFormData(prev => ({ ...prev, priority: value }))
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
            
            {formData.links.length > 0 && (
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
