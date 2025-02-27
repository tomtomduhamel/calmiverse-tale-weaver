
import React, { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GenerateStoryButtonProps {
  disabled?: boolean;
}

const GenerateStoryButton: React.FC<GenerateStoryButtonProps> = ({ disabled }) => {
  const { toast } = useToast();
  const [isError, setIsError] = useState(false);
  
  // Listen for application-level notifications
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setIsError(true);
        toast({
          title: event.detail.title || "Erreur",
          description: event.detail.message || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    };
    
    // Add the event listener
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    // Remove event listener on cleanup
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, [toast]);

  return (
    <Button
      type="submit"
      className={`w-full ${isError ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-primary to-secondary"} text-white py-4 rounded-md flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity`}
      disabled={disabled}
    >
      <BookMarked className="h-5 w-5" />
      <span className="font-medium">
        {disabled ? "Génération en cours..." : isError ? "Réessayer" : "Générer mon histoire"}
      </span>
    </Button>
  );
};

export default GenerateStoryButton;
