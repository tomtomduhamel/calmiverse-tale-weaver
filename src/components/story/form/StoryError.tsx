
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface StoryErrorProps {
  error: string | null;
  className?: string;
}

export const StoryError = ({ error, className }: StoryErrorProps) => {
  useEffect(() => {
    if (error) {
      console.log("[StoryError] Affichage d'une erreur:", {
        message: error,
        timestamp: new Date().toISOString()
      });
    }
  }, [error]);

  if (!error) return null;

  return (
    <div 
      className={cn(
        "p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2 animate-pulse",
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
