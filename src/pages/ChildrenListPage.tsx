import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfilesView } from "@/pages/views/ProfilesView";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { SimpleLoader } from "@/components/ui/SimpleLoader";

/**
 * Page dédiée à la gestion des profils des enfants
 * Utilise ProfilesView pour afficher la liste des enfants
 */
const ChildrenListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    children,
    loading,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild
  } = useSupabaseChildren();
  if (loading) {
    return <SimpleLoader />;
  }
  return <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mr-4">
           Retour à l'accueil
        </Button>
        <h1 className="text-2xl font-bold">Gestion des profils enfants</h1>
      </div>
      
      <ProfilesView children={children} onAddChild={handleAddChild} onUpdateChild={handleUpdateChild} onDeleteChild={handleDeleteChild} onCreateStory={() => navigate("/create-story-simple")} />
    </div>;
};
export default ChildrenListPage;