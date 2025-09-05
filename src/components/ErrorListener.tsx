
import { useEffect, useRef } from "react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { errorManager } from "@/utils/errorHandling/errorNotificationManager";
import { logger } from "@/utils/logger";

/**
 * Composant pour écouter et afficher les erreurs globales de manière centralisée
 * Ce composant doit être monté une fois au niveau racine de l'application
 */
export function ErrorListener() {
  const { notify, notifyError, notifyWarning } = useNotificationCenter();
  const mountTimeRef = useRef(new Date());
  const errorCountRef = useRef({ validation: 0, other: 0 });
  
  useEffect(() => {
    logger.debug("[ErrorListener] 🔄 Initialisation à", mountTimeRef.current.toISOString());
    
    // Configurer le gestionnaire d'erreurs global avec notre système de notification
    errorManager.initWithNotificationCenter(notify);
    
    logger.info("[ErrorListener] ✅ Gestionnaire d'erreurs initialisé avec le centre de notification");
    
    // Écouter les erreurs spécifiques au formulaire d'histoire
    const handleStoryFormError = (event: CustomEvent) => {
      const { type, message, source, timestamp } = event.detail;
      
      if (type === 'validation') {
        errorCountRef.current.validation++;
        notifyWarning("Validation", message);
      } else {
        errorCountRef.current.other++;
        notifyError("Erreur", message);
      }
      
      logger.warn("[ErrorListener] ❌ Erreur de formulaire d'histoire traitée:", {
        type,
        message,
        source: source || 'non spécifié',
        timestamp: timestamp || new Date().toISOString(),
        compteurValidation: errorCountRef.current.validation,
        compteurAutres: errorCountRef.current.other
      });
    };
    
    // S'abonner aux événements d'erreur spécifiques
    document.addEventListener('story-form-error', handleStoryFormError as EventListener);
    
    // Nettoyer lors du démontage
    return () => {
      document.removeEventListener('story-form-error', handleStoryFormError as EventListener);
      logger.debug("[ErrorListener] 🧹 Nettoyage - gestionnaire d'erreurs démonté après", {
        duréeVieMs: new Date().getTime() - mountTimeRef.current.getTime(),
        erreursValidation: errorCountRef.current.validation,
        autresErreurs: errorCountRef.current.other
      });
    };
  }, [notify, notifyError, notifyWarning]);
  
  // Ce composant ne rend rien visuellement
  return null;
}
