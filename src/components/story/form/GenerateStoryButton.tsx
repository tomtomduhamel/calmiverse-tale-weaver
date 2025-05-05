
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = React.memo(({ 
  disabled = false, 
  ...props 
}: GenerateStoryButtonProps) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const isMobile = useIsMobile();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Effet isolé pour gérer le compte à rebours avec useRef pour éviter les fuites
  useEffect(() => {
    if (countdownActive && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCountdownActive(false);
      setCountdown(10);
    }
    
    // Nettoyage du timer à chaque changement d'état ou démontage
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdownActive, countdown]);

  // Gestionnaire d'événements stable qui ne provoque pas de rendus excessifs
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || countdownActive) {
      e.preventDefault();
      return;
    }
    
    setCountdownActive(true);
    // Le onClick par défaut du bouton gère la soumission du formulaire
    // sans créer de boucles de mise à jour
  };

  return (
    <Button
      type="submit"
      onClick={handleButtonClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 sm:py-6 text-base sm:text-lg font-bold transition-all animate-fade-in shadow-lg",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90",
        isMobile ? "rounded-xl fixed bottom-20 left-0 right-0 mx-4 z-10" : ""
      )}
      aria-disabled={disabled}
      data-testid="generate-story-button"
      {...props}
    >
      {countdownActive ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          {`Génération en cours (${countdown}s)`}
        </>
      ) : (
        <>
          <Wand2 className="w-5 h-5 mr-2" />
          Générer mon histoire
        </>
      )}
    </Button>
  );
});

GenerateStoryButton.displayName = "GenerateStoryButton";

export default GenerateStoryButton;
