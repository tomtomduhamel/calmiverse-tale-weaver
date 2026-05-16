import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
interface LibraryHeaderProps {
  isZenMode: boolean;
  onZenModeToggle: () => void;
}
const LibraryHeader = ({
  isZenMode,
  onZenModeToggle
}: LibraryHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handleCreateStory = () => {
    navigate("/create-story/step-1");
  };
  return <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-6'}`}>
      <h2 className={`font-display italic text-foreground ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} animate-fade-up-slow`}>
        {isMobile ? 'Bibliothèque' : 'Bibliothèque des histoires'}
      </h2>
      <div className="flex items-center gap-2">
        <Button onClick={handleCreateStory} size={isMobile ? "sm" : "default"} variant="glow" className="flex items-center gap-2">
          <PlusCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          {isMobile ? 'Créer' : 'Créer une histoire'}
        </Button>
      </div>
    </div>;
};
export default LibraryHeader;