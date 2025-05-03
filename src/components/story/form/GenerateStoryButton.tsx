
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useState, useEffect } from "react";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = ({ disabled = false, ...props }: GenerateStoryButtonProps) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Log pour déboguer l'état disabled du bouton
  useEffect(() => {
    console.log("GenerateStoryButton - État:", {
      disabled,
      countdownActive,
      countdown: countdownActive ? countdown : 'inactif'
    });
  }, [disabled, countdownActive, countdown]);

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

  const handleClick = () => {
    if (!disabled) {
      setCountdownActive(true);
      // Le formulaire va être soumis via le type="submit" du bouton
    }
  };

  return (
    <Button
      type="submit"
      onClick={handleClick}
      disabled={disabled}
      className="w-full py-6 text-lg font-bold transition-all animate-fade-in"
      {...props}
    >
      <Wand2 className="w-5 h-5 mr-2" />
      {countdownActive ? `Génération en cours (${countdown}s)` : "Générer mon histoire"}
    </Button>
  );
};

export default GenerateStoryButton;
