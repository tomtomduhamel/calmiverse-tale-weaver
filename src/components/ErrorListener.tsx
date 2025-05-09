
import { useEffect } from "react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { errorManager } from "@/utils/errorHandling/errorNotificationManager";

/**
 * Composant pour écouter et afficher les erreurs globales
 * Ce composant doit être monté une fois au niveau racine de l'application
 */
export function ErrorListener() {
  const { notify } = useNotificationCenter();
  
  useEffect(() => {
    // Configurer le gestionnaire d'erreurs global avec notre système de notification
    errorManager.initWithNotificationCenter(notify);
    
    // Écouter les erreurs non capturées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[ErrorListener] Unhandled promise rejection:", event.reason);
      errorManager.handleError(event.reason, 'unknown');
      // Empêcher l'erreur non gérée par défaut du navigateur
      event.preventDefault();
    };
    
    const handleGlobalError = (event: ErrorEvent) => {
      // Ignorer les erreurs de ressources externes (scripts, images, etc.)
      if (event.filename && (
        event.filename.includes('chrome-extension://') || 
        event.filename.includes('script') && event.colno === 0
      )) {
        return;
      }
      
      console.error("[ErrorListener] Global error:", event.message);
      errorManager.handleError(new Error(event.message), 'unknown');
    };
    
    // S'abonner aux événements d'erreur globaux
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    
    // Nettoyer lors du démontage
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [notify]);
  
  // Ce composant ne rend rien visuellement
  return null;
}
