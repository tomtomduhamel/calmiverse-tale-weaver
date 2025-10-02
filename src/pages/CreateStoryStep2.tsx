import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate } from "react-router-dom";
import ObjectiveSelectionStep from "@/components/story/steps/ObjectiveSelectionStep";
import { StoryGenerationManager } from "@/services/stories/StoryGenerationManager";

const CreateStoryStep2: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();

  if (authLoading || childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <StoryGenerationManager>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <ObjectiveSelectionStep children={children} />
        </div>
      </div>
    </StoryGenerationManager>
  );
};

export default CreateStoryStep2;