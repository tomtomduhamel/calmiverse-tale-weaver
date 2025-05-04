
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = ({ disabled = false, ...props }: GenerateStoryButtonProps) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [buttonClicked, setButtonClicked] = useState(false);
  const isMobile = useIsMobile();
  
  // Log pour déboguer l'état disabled du bouton - utilisons useCallback pour éviter des rendus inutiles
  const logButtonState = useCallback(() => {
    console.log("GenerateStoryButton - État:", {
      disabled,
      countdownActive,
      buttonClicked,
      countdown: countdownActive ? countdown : 'inactif'
    });
  }, [disabled, countdownActive, countdown, buttonClicked]);

  // N'exécuter ce log qu'aux changements réels d'état
  useEffect(() => {
    logButtonState();
  }, [disabled, countdownActive, countdown, buttonClicked, logButtonState]);

  // Animation de countdown d'accessibilité lorsque le bouton est cliqué
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
    
    return () => clearTimeout(timer);
  }, [countdownActive, countdown]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      console.log("Bouton de génération cliqué, désactivé =", disabled);
      setCountdownActive(true);
      setButtonClicked(true);
      
      // Le formulaire va être soumis via le type="submit" du bouton
      setTimeout(() => {
        setButtonClicked(false);
      }, 500);
    } else {
      // Empêcher la soumission si désactivé
      e.preventDefault();
      console.log("Clic sur bouton désactivé, prévention de la soumission");
    }
  };

  return (
    <Button
      type="submit"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 sm:py-6 text-base sm:text-lg font-bold transition-all animate-fade-in shadow-lg",
        buttonClicked && !disabled ? "bg-primary/80" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90",
        isMobile ? "rounded-xl" : ""
      )}
      aria-disabled={disabled}
      {...props}
    >
      <Wand2 className="w-5 h-5 mr-2" />
      {countdownActive ? `Génération en cours (${countdown}s)` : "Générer mon histoire"}
    </Button>
  );
};

export default GenerateStoryButton;
