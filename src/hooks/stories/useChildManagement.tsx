
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import type { ViewType } from "@/types/views";

/**
 * Hook spécialisé pour gérer les opérations liées aux profils d'enfants
 */
export const useChildManagement = (setCurrentView: (view: ViewType) => void) => {
  const { 
    children, 
    handleAddChild, 
    handleUpdateChild, 
    handleDeleteChild, 
    loading: childrenLoading 
  } = useSupabaseChildren();
  
  const { toast } = useToast();

  // Création d'un enfant depuis l'interface de création d'histoire
  const handleCreateChildFromStory = async (child: Omit<Child, "id">): Promise<string> => {
    try {
      const childId = await handleAddChild(child);
      setCurrentView("create");
      return childId;
    } catch (error) {
      console.error("Error creating child:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil enfant",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    children,
    childrenLoading,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    handleCreateChildFromStory
  };
};
