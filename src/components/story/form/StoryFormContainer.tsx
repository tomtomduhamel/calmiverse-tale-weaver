
import React from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import UnifiedStoryCreator from "@/components/story/UnifiedStoryCreator";
import LoadingStory from "@/components/LoadingStory";
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
    return <LoadingStory />;
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
