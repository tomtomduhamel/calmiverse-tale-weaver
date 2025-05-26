
import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import LoadingStory from "@/components/LoadingStory";
import N8nStoryCreator from "@/components/story/n8n/N8nStoryCreator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreateStoryN8n: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();

  const handleStoryCreated = (storyId: string) => {
    console.log('Histoire n8n créée:', storyId);
    // Rediriger vers la bibliothèque après création
    navigate("/");
  };

  const handleBack = () => {
    navigate("/");
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
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Créer une nouvelle histoire
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Générez une histoire personnalisée pour vos enfants en quelques clics
            </p>
          </div>
        </div>

        {/* Composant de création d'histoire n8n */}
        <div className="max-w-4xl mx-auto">
          <N8nStoryCreator 
            children={children} 
            onStoryCreated={handleStoryCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateStoryN8n;
