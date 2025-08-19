
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface LibraryHeaderProps {
  isZenMode: boolean;
  onZenModeToggle: () => void;
}

const LibraryHeader = ({ isZenMode, onZenModeToggle }: LibraryHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleCreateStory = () => {
    navigate("/create-story/step-1");
  };

  return (
    <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-6'}`}>
      <h2 className={`font-semibold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
        {isMobile ? 'Bibliothèque' : 'Bibliothèque des histoires'}
      </h2>
      <div className="flex items-center gap-2">
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            onClick={onZenModeToggle}
            className={`${isZenMode ? 'bg-primary text-white' : ''}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={handleCreateStory}
          size={isMobile ? "sm" : "default"}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
        >
          <PlusCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          {isMobile ? 'Créer' : 'Créer une histoire'}
        </Button>
      </div>
    </div>
  );
};

export default LibraryHeader;
