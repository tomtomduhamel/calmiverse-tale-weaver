
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";

interface StoryErrorProps {
  error: string | null;
  className?: string;
  showToast?: boolean;
}

/**
 * Composant amélioré pour afficher les erreurs avec notifications
 */
export const StoryError = ({ 
  error, 
  className,
  showToast = true
}: StoryErrorProps) => {
  const { notifyError } = useNotificationCenter();
  
  useEffect(() => {
    if (error) {
      console.log("[StoryError] Affichage d'une erreur:", {
        message: error,
        timestamp: new Date().toISOString()
      });
      
      // Afficher une notification toast pour les erreurs importantes si demandé
      if (showToast) {
        notifyError("Erreur de validation", error);
      }
    } else {
      console.log("[StoryError] Effacement d'une erreur précédente");
    }
  }, [error, notifyError, showToast]);

  if (!error) return null;

  return (
    <div 
      className={cn(
        "p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="text-sm font-medium">{error}</div>
    </div>
  );
};
