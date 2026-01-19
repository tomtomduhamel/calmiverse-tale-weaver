import React, { useEffect } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TitleBasedStoryCreator from "@/components/story/title/TitleBasedStoryCreator";
import StoryCreationErrorBoundary from "@/components/ui/StoryCreationErrorBoundary";
import { useTitleGeneration } from "@/contexts/TitleGenerationContext";
const CreateStoryTitles: React.FC = () => {
  const {
    user,
    const {
      selectedChildrenIds,
      selectedObjective,
      updateCurrentStep,
      generatedTitles,
      isGeneratingTitles
    } = useTitleGeneration();

  useEffect(() => {
    // Si pas de enfants ou objectif, on redirige
    if (selectedChildrenIds.length === 0 || !selectedObjective) {
      // Sauf si on est déjà en train de charger quelque chose (pour éviter flash)
      console.log('[CreateStoryTitles] Données manquantes, redirection vers step 1');
      navigate("/create-story/step-1");
      return;
    }

    // Forcer l'étape "titles" si on arrive sur cette page
    updateCurrentStep('titles');
  }, [selectedChildrenIds, selectedObjective, updateCurrentStep, navigate]);

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
        <StoryCreationErrorBoundary>
          <TitleBasedStoryCreator children={children} onStoryCreated={handleStoryCreated} preSelectedChildId={preSelectedChildId} />
        </StoryCreationErrorBoundary>
      </div>
    </div>
  </div>;
};
export default CreateStoryTitles;