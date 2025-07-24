
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfilesView } from "@/pages/views/ProfilesView";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { SimpleLoader } from "@/components/ui/SimpleLoader";

/**
 * Page dédiée à la gestion des profils des enfants
 * Utilise ProfilesView pour afficher la liste des enfants avec le nouveau design moderne
 */
const ChildrenListPage: React.FC = () => {
  const navigate = useNavigate();
  const { children, loading, handleAddChild, handleUpdateChild, handleDeleteChild } = useSupabaseChildren();

  if (loading) {
    return <SimpleLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")} 
            className="mr-4 hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour à l'accueil
          </Button>
        </div>
        
        <ProfilesView
          children={children}
          onAddChild={handleAddChild}
          onUpdateChild={handleUpdateChild}
          onDeleteChild={handleDeleteChild}
          onCreateStory={() => navigate("/create-story-simple")}
          // TODO: Add stories count mapping from useSupabaseStories
          storiesCountMap={{}}
          totalStories={0}
        />
      </div>
    </div>
  );
};

export default ChildrenListPage;
