
import React from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import UnifiedStoryCreator from "@/components/story/UnifiedStoryCreator";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

const StoryFormContainer: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // Vérification minimale d'authentification et de chargement
  const { user, loading: authLoading } = useSupabaseAuth();
  const { isLoading: objectivesLoading } = useStoryObjectives();

  // États de chargement
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }

  // Utiliser directement notre nouveau composant unifié
  return (
    <div className="w-full max-w-4xl mx-auto">
      <UnifiedStoryCreator
        onSubmit={onSubmit}
        children={children}
        onCreateChild={onCreateChild}
        onStoryCreated={onStoryCreated}
      />
    </div>
  );
};

export default StoryFormContainer;
