
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = React.forwardRef<HTMLButtonElement, GenerateStoryButtonProps>(({ 
  disabled = false, 
  ...props 
}, ref) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const isMobile = useIsMobile();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Log pour déboguer l'état désactivé
  useEffect(() => {
    console.log("[GenerateStoryButton] État du bouton:", { disabled, countdownActive });
  }, [disabled, countdownActive]);
  
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

  // Simplification des classes pour éviter les problèmes de style
  const buttonStyles = cn(
    "w-full py-4 sm:py-6 text-base sm:text-lg font-bold transition-all animate-fade-in shadow-lg",
    (disabled || countdownActive) 
      ? "opacity-50 cursor-not-allowed" 
      : "hover:bg-primary/90"
  );

  return (
    <Button
      type="submit"
      ref={ref}
      disabled={disabled || countdownActive}
      className={buttonStyles}
      aria-disabled={disabled || countdownActive}
      data-testid="generate-story-button"
      {...props}
      onClick={(e) => {
        console.log("[GenerateStoryButton] Clic sur le bouton, disabled:", disabled);
        if (!disabled && !countdownActive && props.onClick) {
          props.onClick(e);
        }
      }}
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
