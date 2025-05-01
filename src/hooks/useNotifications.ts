
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { initializeNotificationManager } from "@/utils/errorHandling/notificationManager";

export const useNotifications = (setFormError: (error: string | null) => void) => {
  const { toast } = useToast();

  useEffect(() => {
    // Initialiser le gestionnaire de notifications
    initializeNotificationManager();

    // Écouter les événements de notification au niveau de l'application
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setFormError(event.detail.message || "Une erreur est survenue");
        toast({
          title: event.detail.title || "Erreur",
          description: event.detail.message || "Une erreur est survenue lors de la génération",
          variant: "destructive",
        });
      } else if (event.detail.type === 'success') {
        setFormError(null);
        toast({
          title: event.detail.title || "Succès",
          description: event.detail.message || "Opération réussie",
        });
      } else if (event.detail.type === 'info') {
        toast({
          title: event.detail.title || "Information",
          description: event.detail.message || "Information",
        });
      } else if (event.detail.type === 'warning') {
        toast({
          title: event.detail.title || "Attention",
          description: event.detail.message || "Soyez vigilant",
        });
      } else if (event.detail.type === 'retry') {
        // Gérer les notifications de type retry si nécessaire
      }
    };
    
    // Ajouter l'écouteur d'événements
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    // Supprimer l'écouteur d'événements lors du nettoyage
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, [toast, setFormError]);

  return { toast };
};
