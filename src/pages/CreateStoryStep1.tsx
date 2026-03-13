import React, { useState, useCallback } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import MagicStoryCreator from "@/components/story/steps/MagicStoryCreator";
import LoadingWithTimeout from "@/components/ui/LoadingWithTimeout";
import CreationModeToggle from "@/components/story/chat/CreationModeToggle";
import ChatStoryCreator from "@/components/story/chat/ChatStoryCreator";
import { useTitleGeneration } from "@/contexts/TitleGenerationContext";
import type { CreationMode } from "@/types/chatbot";

const CreateStoryStep1: React.FC = () => {
  const { user, loading: authLoading, error: authError, timeoutReached: authTimeout, retryAuth } = useSupabaseAuth();
  const { children, loading: childrenLoading, error: childrenError, timeoutReached: childrenTimeout, retryLoadChildren } = useSupabaseChildren();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedChildId = searchParams.get("childId") || undefined;
  const [currentStep, setCurrentStep] = useState(0);

  // Mode de création persisté (survit aux changements d'onglet)
  const { creationMode, updateCreationMode, forceSave } = useTitleGeneration();

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

  // ÉTAT VIDE : chargement terminé sans erreur mais aucun profil n'existe
  const loadingDone = !authLoading && !childrenLoading && !childrenTimeout && user;
  if (loadingDone && children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icône */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-5xl">👧</span>
            </div>
          </div>

          {/* Titre et description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Commençons par créer un profil !
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Pour créer une histoire personnalisée, ajoutez d'abord un profil —
              un enfant, un animal de compagnie ou un adulte. Calmi adaptera
              chaque histoire à ce profil.
            </p>
          </div>

          {/* CTA principal */}
          <button
            onClick={() => navigate("/children")}
            className="w-full bg-primary text-primary-foreground rounded-xl py-4 px-6 text-base font-semibold hover:bg-primary/90 transition-colors shadow-md"
          >
            ✨ Ajouter un profil
          </button>

          {/* Lien secondaire */}
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const shouldShowLoading = isLoading && children.length === 0;
  const shouldShowTimeout = hasTimedOut && children.length === 0;
  const shouldShowError = !!(errorMessage && children.length === 0);

  if (shouldShowLoading || shouldShowTimeout || shouldShowError) {

    return (
      <LoadingWithTimeout
        isLoading={shouldShowLoading}
        hasTimedOut={shouldShowTimeout}
        error={shouldShowError ? errorMessage : null}
        onRetry={handleRetry}
        onFallbackAction={handleFallback}
        fallbackActionLabel="Voir mes histoires"
        loadingMessage={authLoading ? "Connexion en cours..." : "📍 Calmi vous retrouve..."}
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
        <MagicStoryCreator
          childrenList={children}
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