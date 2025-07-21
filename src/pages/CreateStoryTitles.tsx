
import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TitleBasedStoryCreator from "@/components/story/title/TitleBasedStoryCreator";
import LoadingStory from "@/components/LoadingStory";

const CreateStoryTitles: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStoryCreated = (storyId: string) => {
    console.log("[CreateStoryTitles] Processus de création terminé:", storyId);
    
    if (storyId === "timeout") {
      // Cas de timeout - rediriger vers la bibliothèque avec un message
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération. Vérifiez votre bibliothèque dans quelques minutes.",
      });
    } else {
      // Succès normal
      toast({
        title: "Histoire créée avec succès",
        description: "Votre histoire personnalisée a été créée et ajoutée à votre bibliothèque",
      });
    }
    
    // Dans tous les cas, rediriger vers la bibliothèque
    navigate("/library");
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
              Créer une histoire avec sélection de titres
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Générez 3 titres d'histoires personnalisés, puis choisissez celui qui vous inspire le plus
            </p>
          </div>
        </div>

        {/* Composant de création d'histoires avec titres */}
        <div className="max-w-4xl mx-auto">
          <TitleBasedStoryCreator
            children={children}
            onStoryCreated={handleStoryCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateStoryTitles;
