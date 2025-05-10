
import { useEffect, useRef } from "react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { errorManager } from "@/utils/errorHandling/errorNotificationManager";

/**
 * Composant pour écouter et afficher les erreurs globales de manière centralisée
 * Ce composant doit être monté une fois au niveau racine de l'application
 */
export function ErrorListener() {
  const { notify, notifyError, notifyWarning } = useNotificationCenter();
  const mountTimeRef = useRef(new Date());
  const errorCountRef = useRef({ validation: 0, other: 0 });
  
  useEffect(() => {
    console.log("[ErrorListener] 🔄 Initialisation à", mountTimeRef.current.toISOString());
    
    // Configurer le gestionnaire d'erreurs global avec notre système de notification
    errorManager.initWithNotificationCenter(notify);
    
    console.log("[ErrorListener] ✅ Gestionnaire d'erreurs initialisé avec le centre de notification");
    
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
      
      console.log("[ErrorListener] ❌ Erreur de formulaire d'histoire traitée:", {
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
    
    // Fonction pour émettre un événement d'erreur de test au démarrage pour vérifier le système
    const emitTestError = () => {
      console.log("[ErrorListener] 🧪 Émission d'une erreur de test pour vérifier le système");
      const testEvent = new CustomEvent('story-form-error', {
        detail: {
          type: 'test',
          message: 'Test du système de notification',
          source: 'ErrorListener',
          timestamp: new Date().toISOString()
        }
      });
      
      // Pour éviter d'afficher une notification à l'utilisateur, on n'émet pas l'événement
      // mais on simule le traitement pour le débogage
      handleStoryFormError(testEvent);
    };
    
    // Décommenter pour tester le système
    // setTimeout(emitTestError, 1000);
    
    // Nettoyer lors du démontage
    return () => {
      document.removeEventListener('story-form-error', handleStoryFormError as EventListener);
      console.log("[ErrorListener] 🧹 Nettoyage - gestionnaire d'erreurs démonté après", {
        duréeVieMs: new Date().getTime() - mountTimeRef.current.getTime(),
        erreursValidation: errorCountRef.current.validation,
        autresErreurs: errorCountRef.current.other
      });
    };
  }, [notify, notifyError, notifyWarning]);
  
  // Ce composant ne rend rien visuellement
  return null;
}
