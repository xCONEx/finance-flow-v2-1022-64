
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProjectModal from "./ProjectModal";

interface HeaderProps {
  onAddProject?: (project: any) => void;
}

const Header = ({ onAddProject }: HeaderProps) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleAddProject = (projectData: any) => {
    if (onAddProject) {
      onAddProject(projectData);
    }
    setIsProjectModalOpen(false);
  };

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-black">EntregaFlow</h1>
                <p className="text-xs text-brand-gray">Gerenciador de Entregas</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                size="sm"
                onClick={() => setIsProjectModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleAddProject}
      />
    </>
  );
};

export default Header;
