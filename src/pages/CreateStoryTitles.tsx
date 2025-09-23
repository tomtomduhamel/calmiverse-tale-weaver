import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TitleBasedStoryCreator from "@/components/story/title/TitleBasedStoryCreator";
const CreateStoryTitles: React.FC = () => {
  const {
    user,
    loading: authLoading
  } = useSupabaseAuth();
  const {
    children,
    loading: childrenLoading
  } = useSupabaseChildren();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Récupérer l'ID de l'enfant présélectionné depuis l'URL
  const preSelectedChildId = searchParams.get('childId') || undefined;
  const handleStoryCreated = (storyId: string) => {
    console.log("[CreateStoryTitles] Processus de création terminé:", storyId);
    if (storyId === "timeout") {
      // Cas de timeout - rediriger vers la bibliothèque avec un message
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération. Vérifiez votre bibliothèque dans quelques minutes."
      });
      navigate("/library");
    } else if (storyId === "library") {
      // Nouveau cas : Création lancée, redirection immédiate vers bibliothèque
      console.log("[CreateStoryTitles] Redirection immédiate vers bibliothèque après lancement création");
      navigate("/library");
    } else {
      // Succès normal - rediriger directement vers l'histoire créée
      console.log("[CreateStoryTitles] Redirection vers l'histoire créée:", storyId);
      navigate(`/reader/${storyId}`);
    }
  };
  const handleBack = () => {
    navigate("/");
  };
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
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          
          
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
          <TitleBasedStoryCreator children={children} onStoryCreated={handleStoryCreated} preSelectedChildId={preSelectedChildId} />
        </div>
      </div>
    </div>;
};
export default CreateStoryTitles;