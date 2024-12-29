import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

interface ProfileHeaderProps {
  onShowForm: () => void;
  showForm: boolean;
  onCreateStory?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onShowForm, showForm, onCreateStory }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-secondary text-center">L'univers des enfants</h2>
      <div className="flex gap-2">
        {onCreateStory && (
          <Button 
            onClick={onCreateStory}
            className="bg-accent hover:bg-accent/90"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Créer une histoire</span>
          </Button>
        )}
        {!showForm && (
          <Button 
            onClick={onShowForm}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Ajouter un enfant</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;