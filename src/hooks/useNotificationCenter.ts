
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ToastActionElement } from "@/components/ui/toast";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  duration?: number;
  preserveOnRouteChange?: boolean;
  action?: ToastActionElement;
  className?: string;
}

/**
 * Hook pour gérer les notifications centralisées dans l'application
 */
export const useNotificationCenter = () => {
  const { toast } = useToast();

  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: NotificationOptions
    ) => {
      // Configuration de base de la notification
      const notificationConfig = {
        title,
        description: message,
        // Pour error et warning, on utilise le variant destructive
        variant: type === "error" || type === "warning" ? "destructive" : "default",
        duration: options?.duration || (type === "error" ? 6000 : 4000),
        className: options?.className,
        action: options?.action,
      };

      // Ajouter des classes spécifiques selon le type
      if (type === "warning") {
        notificationConfig.className = `bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 ${
          notificationConfig.className || ""
        }`;
      } else if (type === "info") {
        notificationConfig.className = `bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 ${
          notificationConfig.className || ""
        }`;
      } else if (type === "success") {
        notificationConfig.className = `bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 ${
          notificationConfig.className || ""
        }`;
      }

      // Envoi de la notification via toast
      return toast(notificationConfig);
    },
    [toast]
  );

  // Fonctions spécialisées pour chaque type de notification
  const notifySuccess = useCallback(
    (title: string, message: string, options?: NotificationOptions) =>
      notify("success", title, message, options),
    [notify]
  );

  const notifyError = useCallback(
    (title: string, message: string, options?: NotificationOptions) =>
      notify("error", title, message, options),
    [notify]
  );

  const notifyWarning = useCallback(
    (title: string, message: string, options?: NotificationOptions) =>
      notify("warning", title, message, options),
    [notify]
  );

  const notifyInfo = useCallback(
    (title: string, message: string, options?: NotificationOptions) =>
      notify("info", title, message, options),
    [notify]
  );

  // Notification avec action
  const notifyWithAction = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      action: ToastActionElement,
      options?: NotificationOptions
    ) => {
      return notify(type, title, message, { ...options, action });
    },
    [notify]
  );

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyWithAction,
  };
};
