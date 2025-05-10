
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";

interface StoryErrorProps {
  error: string | null;
  className?: string;
  showToast?: boolean;
}

/**
 * Composant amélioré pour afficher les erreurs avec notifications et débogage avancé
 */
export const StoryError = ({ 
  error, 
  className,
  showToast = true
}: StoryErrorProps) => {
  const { notifyError } = useNotificationCenter();
  const previousErrorRef = useRef<string | null>(null);
  const mountTimeRef = useRef(new Date());
  const errorCountRef = useRef(0);
  
  useEffect(() => {
    // Initialisation du composant
    console.log("[StoryError] 🔧 Composant monté à", mountTimeRef.current.toISOString(), {
      erreurInitiale: error
    });
    
    return () => {
      console.log("[StoryError] 🧹 Composant démonté après", {
        duréeVieMs: new Date().getTime() - mountTimeRef.current.getTime(),
        nombreChangements: errorCountRef.current,
        dernièreErreur: previousErrorRef.current
      });
    };
  }, []);
  
  useEffect(() => {
    // Incrémenter le compteur de changements
    errorCountRef.current++;
    
    if (error) {
      console.log("[StoryError] ❌ Affichage d'une erreur:", {
        message: error,
        précédente: previousErrorRef.current,
        changementNum: errorCountRef.current,
        timestamp: new Date().toISOString()
      });
      
      // Vérifier si c'est une nouvelle erreur (différente de la précédente)
      const isNewError = error !== previousErrorRef.current;
      
      // Afficher une notification toast pour les erreurs importantes si demandé
      if (showToast && isNewError) {
        console.log("[StoryError] 🔔 Notification toast pour nouvelle erreur");
        notifyError("Erreur de validation", error);
      }
      
      // Émettre un événement personnalisé pour le débogage
      const errorEvent = new CustomEvent('story-error-displayed', {
        detail: { 
          error, 
          timestamp: new Date().toISOString(),
          isNewError
        }
      });
      document.dispatchEvent(errorEvent);
    } else if (previousErrorRef.current) {
      console.log("[StoryError] ✅ Effacement d'une erreur précédente:", {
        précédente: previousErrorRef.current,
        changementNum: errorCountRef.current,
        timestamp: new Date().toISOString()
      });
      
      // Émettre un événement personnalisé pour le débogage
      const clearEvent = new CustomEvent('story-error-cleared', {
        detail: { 
          previousError: previousErrorRef.current,
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(clearEvent);
    }
    
    // Mettre à jour la référence de l'erreur précédente
    previousErrorRef.current = error;
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
      data-error-message={error}
      data-error-count={errorCountRef.current}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="text-sm font-medium">{error}</div>
    </div>
  );
};
