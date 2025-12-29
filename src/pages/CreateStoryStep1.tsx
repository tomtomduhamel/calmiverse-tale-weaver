import React, { useState, useCallback } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChildrenSelectionStep from "@/components/story/steps/ChildrenSelectionStep";
import LoadingWithTimeout from "@/components/ui/LoadingWithTimeout";
import CreationModeToggle from "@/components/story/chat/CreationModeToggle";
import ChatStoryCreator from "@/components/story/chat/ChatStoryCreator";
import { usePersistedStoryCreation } from "@/hooks/stories/usePersistedStoryCreation";
import type { CreationMode } from "@/types/chatbot";

const CreateStoryStep1: React.FC = () => {
  const { user, loading: authLoading, error: authError, timeoutReached: authTimeout, retryAuth } = useSupabaseAuth();
  const { children, loading: childrenLoading, error: childrenError, timeoutReached: childrenTimeout, retryLoadChildren } = useSupabaseChildren();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedChildId = searchParams.get("childId") || undefined;
  const [currentStep, setCurrentStep] = useState(0);
  
  // Mode de création persisté (survit aux changements d'onglet)
  const { creationMode, updateCreationMode, forceSave } = usePersistedStoryCreation();

  // PHASE 3: Gestion des étapes de progression
  React.useEffect(() => {
    if (!authLoading && user) setCurrentStep(1);
    if (!childrenLoading && !childrenError) setCurrentStep(2);
  }, [authLoading, user, childrenLoading, childrenError]);

  // États combinés pour interface unifiée
  const isLoading = authLoading || childrenLoading;
  const hasTimedOut = authTimeout || childrenTimeout;
  const errorMessage = authError || childrenError || null;

  // Actions de récupération
  const handleRetry = () => {
    if (authError) retryAuth();
    if (childrenError) retryLoadChildren();
  };

  const handleFallback = () => {
    navigate("/library");
  };

  const handleQuickCreate = () => {
    navigate("/kids-profile");
  };

  // Handler avec persistance immédiate
  const handleModeChange = useCallback((mode: CreationMode) => {
    updateCreationMode(mode);
    forceSave(); // Sauvegarde immédiate pour survie aux changements d'onglet
  }, [updateCreationMode, forceSave]);

  const handleBackToGuided = useCallback(() => {
    handleModeChange('guided');
  }, [handleModeChange]);

  // PHASE 3: Affichage optimiste - permettre l'affichage même après timeout si données disponibles
  // CORRECTION CRITIQUE : Ne pas bloquer l'affichage si on a des enfants
  const shouldShowLoading = isLoading && children.length === 0;
  const shouldShowTimeout = hasTimedOut && children.length === 0;
  const shouldShowError = errorMessage && children.length === 0;

  if (shouldShowLoading || shouldShowTimeout || shouldShowError) {
    return (
      <LoadingWithTimeout
        isLoading={shouldShowLoading}
        hasTimedOut={shouldShowTimeout}
        error={shouldShowError ? errorMessage : null}
        onRetry={handleRetry}
        onFallbackAction={handleFallback}
        fallbackActionLabel="Voir mes histoires"
        loadingMessage={authLoading ? "Connexion en cours..." : "Chargement des profils..."}
        onQuickCreate={handleQuickCreate}
        canContinueWithoutData={false}
        progressSteps={["Authentification", "Profils enfants", "Création"]}
        currentStep={currentStep}
      />
    );
  }

  // Affichage normal - même avec timeout si des enfants sont chargés
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Toggle de mode de création */}
      <CreationModeToggle mode={creationMode} onModeChange={handleModeChange} />

      {/* Rendu conditionnel selon le mode */}
      {creationMode === 'guided' ? (
        <ChildrenSelectionStep 
          children={children} 
          preSelectedChildId={preSelectedChildId} 
        />
      ) : (
        <ChatStoryCreator 
          children={children} 
          onBack={handleBackToGuided} 
        />
      )}
    </div>
  );
};

export default CreateStoryStep1;