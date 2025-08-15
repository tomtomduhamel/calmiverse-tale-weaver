
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LibraryHeaderProps {
  isZenMode: boolean;
  onZenModeToggle: () => void;
}

const LibraryHeader = ({ isZenMode, onZenModeToggle }: LibraryHeaderProps) => {
  const navigate = useNavigate();
  
  const handleCreateStory = () => {
    navigate("/create-story/step-1");
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Bibliothèque des histoires</h2>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onZenModeToggle}
          className={`${isZenMode ? 'bg-primary text-white' : ''}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleCreateStory}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Créer une histoire
        </Button>
      </div>
    </div>
  );
};

export default LibraryHeader;
