import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LoadingStory from "@/components/LoadingStory";
import TitleSelectionStep from "@/components/story/steps/TitleSelectionStep";

const CreateStoryStep3: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStoryCreated = (storyId: string) => {
    console.log("[CreateStoryStep3] Processus de création terminé:", storyId);
    if (storyId === "timeout") {
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération. Vérifiez votre bibliothèque dans quelques minutes."
      });
      navigate("/library");
    } else {
      console.log("[CreateStoryStep3] Redirection vers l'histoire créée:", storyId);
      navigate(`/reader/${storyId}`);
    }
  };

  if (authLoading || childrenLoading) {
    return <LoadingStory />;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <TitleSelectionStep children={children} onStoryCreated={handleStoryCreated} />
      </div>
    </div>
  );
};

export default CreateStoryStep3;