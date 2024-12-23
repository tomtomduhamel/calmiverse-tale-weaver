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
      <h2 className="text-2xl font-semibold text-secondary text-center w-full">L'univers des enfants</h2>
      {!showForm && (
        <Button 
          onClick={onShowForm}
          className="bg-accent hover:bg-accent/90 fixed bottom-4 right-4 md:static md:bottom-auto md:right-auto rounded-full md:rounded-lg p-2 md:p-2 shadow-lg md:shadow-none"
          size="icon"
        >
          <Plus className="w-6 h-6 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Ajouter un enfant</span>
        </Button>
      )}
    </div>
  );
};

export default ProfileHeader;