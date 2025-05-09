
import { useToast } from "@/hooks/use-toast";
import { useNotificationCenter } from "./useNotificationCenter";

/**
 * Hook de compatibilité pour permettre la transition vers le nouveau système de notification
 * @deprecated Utiliser useNotificationCenter à la place
 */
export const useNotifications = (setError?: (error: string | null) => void) => {
  const { toast } = useToast();
  const { 
    notifySuccess, 
    notifyError, 
    notifyInfo, 
    notifyWarning 
  } = useNotificationCenter();

  /**
   * @deprecated Utiliser notifySuccess du useNotificationCenter à la place
   */
  const legacyNotifySuccess = (message: string) => {
    notifySuccess("Succès", message);
  };

  /**
   * @deprecated Utiliser notifyError du useNotificationCenter à la place
   */
  const legacyNotifyError = (message: string) => {
    if (setError) {
      setError(message);
    }
    
    notifyError("Erreur", message);
  };

  /**
   * @deprecated Utiliser notifyInfo du useNotificationCenter à la place
   */
  const legacyNotifyInfo = (message: string) => {
    notifyInfo("Information", message);
  };

  /**
   * @deprecated Utiliser notifyWarning du useNotificationCenter à la place
   */
  const legacyNotifyWarning = (message: string) => {
    notifyWarning("Attention", message);
  };

  return {
    toast,
    notifySuccess: legacyNotifySuccess,
    notifyError: legacyNotifyError,
    notifyInfo: legacyNotifyInfo,
    notifyWarning: legacyNotifyWarning,
    
    // Nouvelles méthodes recommandées
    notifications: {
      success: notifySuccess,
      error: notifyError,
      info: notifyInfo,
      warning: notifyWarning
    }
  };
};
