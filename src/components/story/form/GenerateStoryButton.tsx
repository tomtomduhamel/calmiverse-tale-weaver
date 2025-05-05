
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = React.memo(({ 
  disabled = false, 
  onClick,
  ...props 
}: GenerateStoryButtonProps) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const isMobile = useIsMobile();
  
  // Réinitialiser la logique du compte à rebours
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCountdownActive(false);
      setCountdown(10);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdownActive, countdown]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !countdownActive) {
      setCountdownActive(true);
      
      // Appeler le gestionnaire d'événements onClick fourni par le parent
      if (onClick) {
        onClick(e);
      }
    } else if (disabled) {
      // Empêcher la soumission si désactivé
      e.preventDefault();
    }
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
