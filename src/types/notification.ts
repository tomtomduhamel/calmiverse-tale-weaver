
// Types partagés pour le système de notification
export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
