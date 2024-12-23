import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProfileHeaderProps {
  onShowForm: () => void;
  showForm: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onShowForm, showForm }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-secondary">L'univers des enfants</h2>
      {!showForm && (
        <Button 
          onClick={onShowForm}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un enfant
        </Button>
      )}
    </div>
  );
};

export default ProfileHeader;