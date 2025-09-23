import React from "react";
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
  
  // Récupérer l'ID de l'enfant présélectionné depuis l'URL
  const preSelectedChildId = searchParams.get('childId') || undefined;

  // PHASE 1: Gestion avancée des états de chargement avec timeouts
  const isLoading = authLoading || childrenLoading;
  const hasTimedOut = authTimeout || childrenTimeout;
  const hasError = authError || childrenError;
  
  // Fonction de retry globale
  const handleRetry = () => {
    if (authError || authTimeout) {
      retryAuth?.();
    }
    if (childrenError || childrenTimeout) {
      retryLoadChildren?.();
    }
  };

  // Navigation vers mode simple/bibliothèque
  const handleFallback = () => {
    navigate("/library");
  };

  // Gestion de l'état de chargement/erreur avec timeout
  if (isLoading || hasTimedOut || hasError) {
    return (
      <LoadingWithTimeout
        isLoading={isLoading}
        hasTimedOut={hasTimedOut}
        error={hasError}
        onRetry={handleRetry}
        onFallbackAction={handleFallback}
        fallbackActionLabel="Voir mes histoires"
        loadingMessage="Préparation de la création d'histoire..."
        timeoutMessage="La connexion est lente, mais nous continuons d'essayer"
      />
    );
  }

  // Redirection si pas d'utilisateur
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Affichage normal - PHASE 1: Permettre l'affichage même avec peu d'enfants
  return (
    <ChildrenSelectionStep 
      children={children} 
      preSelectedChildId={preSelectedChildId} 
    />
  );
};

export default CreateStoryStep1;