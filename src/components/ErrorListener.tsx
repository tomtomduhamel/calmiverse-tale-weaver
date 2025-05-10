
import { useEffect } from "react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { errorManager } from "@/utils/errorHandling/errorNotificationManager";

/**
 * Composant pour écouter et afficher les erreurs globales de manière centralisée
 * Ce composant doit être monté une fois au niveau racine de l'application
 */
export function ErrorListener() {
  const { notify, notifyError, notifyWarning } = useNotificationCenter();
  
  useEffect(() => {
    // Configurer le gestionnaire d'erreurs global avec notre système de notification
    errorManager.initWithNotificationCenter(notify);
    
    console.log("[ErrorListener] Gestionnaire d'erreurs initialisé avec le centre de notification");
    
    // Écouter les erreurs spécifiques au formulaire d'histoire
    const handleStoryFormError = (event: CustomEvent) => {
      const { type, message } = event.detail;
      
      if (type === 'validation') {
        notifyWarning("Validation", message);
      } else {
        notifyError("Erreur", message);
      }
      
      console.log("[ErrorListener] Erreur de formulaire d'histoire traitée:", event.detail);
    };
    
    // S'abonner aux événements d'erreur spécifiques
    document.addEventListener('story-form-error', handleStoryFormError as EventListener);
    
    // Nettoyer lors du démontage
    return () => {
      document.removeEventListener('story-form-error', handleStoryFormError as EventListener);
    };
  }, [notify, notifyError, notifyWarning]);
  
  // Ce composant ne rend rien visuellement
  return null;
}
