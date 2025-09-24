import React, { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChildrenSelectionStep from "@/components/story/steps/ChildrenSelectionStep";
import LoadingWithTimeout from "@/components/ui/LoadingWithTimeout";

const CreateStoryStep1: React.FC = () => {
  const { user, loading: authLoading, error: authError, timeoutReached: authTimeout, retryAuth } = useSupabaseAuth();
  const { children, loading: childrenLoading, error: childrenError, timeoutReached: childrenTimeout, retryLoadChildren } = useSupabaseChildren();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedChildId = searchParams.get("childId") || undefined;
  const [currentStep, setCurrentStep] = useState(0);

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

  // PHASE 3: Affichage optimiste - permet l'affichage même avec des données partielles
  if (isLoading || hasTimedOut || errorMessage) {
    return (
      <LoadingWithTimeout
        isLoading={isLoading}
        hasTimedOut={hasTimedOut}
        error={errorMessage}
        onRetry={handleRetry}
        onFallbackAction={handleFallback}
        fallbackActionLabel="Voir mes histoires"
        loadingMessage={authLoading ? "Connexion en cours..." : "Chargement des profils..."}
        onQuickCreate={handleQuickCreate}
        canContinueWithoutData={children.length === 0}
        progressSteps={["Authentification", "Profils enfants", "Création"]}
        currentStep={currentStep}
      />
    );
  }

  // Affichage normal avec mode optimiste
  return (
    <ChildrenSelectionStep 
      children={children} 
      preSelectedChildId={preSelectedChildId} 
    />
  );
};

export default CreateStoryStep1;