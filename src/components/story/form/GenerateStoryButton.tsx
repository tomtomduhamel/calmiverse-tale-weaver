
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface GenerateStoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const GenerateStoryButton = ({ disabled = false, ...props }: GenerateStoryButtonProps) => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [buttonClicked, setButtonClicked] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
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
      setCountdownActive(true);
      setButtonClicked(true);
      
      // Reset button state after animation
      setTimeout(() => {
        setButtonClicked(false);
      }, 500);

      // Show toast for user feedback
      toast({
        title: "Génération d'histoire",
        description: "Nous préparons votre histoire, cela peut prendre une minute...",
      });
    } else {
      // Prevent submission if disabled
      e.preventDefault();
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
};

export default GenerateStoryButton;
