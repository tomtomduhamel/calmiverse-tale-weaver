import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ExternalLink, Plus, Clock, Wifi } from "lucide-react";

interface LoadingWithTimeoutProps {
  isLoading: boolean;
  hasTimedOut?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onFallbackAction?: () => void;
  fallbackActionLabel?: string;
  loadingMessage?: string;
  timeoutMessage?: string;
  children?: React.ReactNode;
  // PHASE 3: Nouvelles props pour mode dégradé avancé
  onQuickCreate?: () => void;
  canContinueWithoutData?: boolean;
  progressSteps?: string[];
  currentStep?: number;
}

const LoadingWithTimeout: React.FC<LoadingWithTimeoutProps> = ({
  isLoading,
  hasTimedOut = false,
  error = null,
  onRetry,
  onFallbackAction,
  fallbackActionLabel = "Mode simple",
  loadingMessage = "Chargement...",
  timeoutMessage = "Le chargement prend plus de temps que prévu",
  children,
  // PHASE 3: Nouvelles props
  onQuickCreate,
  canContinueWithoutData = false,
  progressSteps = ["Connexion", "Chargement des données", "Finalisation"],
  currentStep = 0
}) => {
  // Si pas de loading et pas d'erreur, afficher le contenu
  if (!isLoading && !error && !hasTimedOut) {
    return <>{children}</>;
  }

  // PHASE 3: État de chargement avec progression
  if (isLoading && !hasTimedOut && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
            <Clock className="w-6 h-6 text-primary/70 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">{loadingMessage}</p>
            <div className="text-sm text-muted-foreground">
              ✨ Nos petits lutins magiques préparent tout pour vous
            </div>
          </div>

          {/* PHASE 3: Barre de progression intelligente */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              {progressSteps.map((step, index) => (
                <span 
                  key={index}
                  className={index <= currentStep ? "text-primary font-medium" : ""}
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / progressSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: État d'erreur ou timeout avec options de récupération avancées
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="flex justify-center">
          {hasTimedOut ? (
            <Clock className="w-12 h-12 text-amber-500" />
          ) : error && error.includes('connexion') ? (
            <Wifi className="w-12 h-12 text-red-500" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {hasTimedOut ? "Chargement lent détecté" : 
             error && error.includes('connexion') ? "Problème de réseau" :
             "Problème temporaire"}
          </h3>
          <p className="text-muted-foreground">
            {error || (hasTimedOut ? timeoutMessage : "Une erreur s'est produite")}
          </p>
        </div>

        {/* PHASE 3: Actions de récupération multiples */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            )}
            
            {onFallbackAction && (
              <Button 
                variant="outline" 
                onClick={onFallbackAction}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {fallbackActionLabel}
              </Button>
            )}
          </div>

          {/* PHASE 3: Mode création rapide */}
          {onQuickCreate && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ou continuez directement :
              </p>
              <Button 
                onClick={onQuickCreate}
                variant="secondary"
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer un profil rapidement
              </Button>
            </div>
          )}

          {/* PHASE 3: Continuer sans données */}
          {canContinueWithoutData && (
            <Button 
              variant="ghost" 
              onClick={onFallbackAction}
              className="text-sm"
            >
              Continuer sans charger les profils
            </Button>
          )}
        </div>

        {/* PHASE 3: Messages d'aide contextuelle */}
        <div className="text-xs text-muted-foreground/70 space-y-1 bg-muted/30 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <Wifi className="w-3 h-3" />
            Vérifiez votre connexion internet
          </p>
          <p className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Essayez de rafraîchir la page
          </p>
          {hasTimedOut && (
            <p className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Le serveur répond lentement, veuillez patienter
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingWithTimeout;