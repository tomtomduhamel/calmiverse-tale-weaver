
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileHeaderProps {
  onShowForm: () => void;
  showForm: boolean;
  onCreateStory?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onShowForm, showForm, onCreateStory }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-2xl font-semibold text-secondary">L'univers des enfants</h2>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {onCreateStory && (
          <Button 
            onClick={onCreateStory}
            className="bg-accent hover:bg-accent/90 flex-1 sm:flex-grow-0"
            size={isMobile ? "sm" : "default"}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Créer une histoire</span>
          </Button>
        )}
        {!showForm && (
          <Button 
            onClick={onShowForm}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-grow-0"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Ajouter un enfant</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
