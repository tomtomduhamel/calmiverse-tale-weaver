import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

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
  children
}) => {
  // Si pas de loading et pas d'erreur, afficher le contenu
  if (!isLoading && !error && !hasTimedOut) {
    return <>{children}</>;
  }

  // État de chargement normal
  if (isLoading && !hasTimedOut && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingMessage}</p>
          <div className="text-sm text-muted-foreground/70">
            ✨ Nos petits lutins magiques préparent tout pour vous
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur ou timeout
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="flex justify-center">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {hasTimedOut ? "Chargement lent détecté" : "Problème de connexion"}
          </h3>
          <p className="text-muted-foreground">
            {error || (hasTimedOut ? timeoutMessage : "Une erreur s'est produite")}
          </p>
        </div>

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

        <div className="text-xs text-muted-foreground/70 space-y-1">
          <p>💡 Astuce : Vérifiez votre connexion internet</p>
          <p>🔄 Le problème persiste ? Essayez de rafraîchir la page</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingWithTimeout;