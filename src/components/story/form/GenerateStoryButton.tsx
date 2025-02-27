
import React, { useEffect, useState } from "react";
import { BookMarked, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GenerateStoryButtonProps {
  disabled?: boolean;
}

const GenerateStoryButton: React.FC<GenerateStoryButtonProps> = ({ disabled }) => {
  const { toast } = useToast();
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Listen for application-level notifications
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setIsError(true);
        setErrorMessage(event.detail.message || "Une erreur est survenue");
        toast({
          title: event.detail.title || "Erreur",
          description: event.detail.message || "Une erreur est survenue lors de la génération",
          variant: "destructive",
        });
      } else if (event.detail.type === 'success') {
        setIsError(false);
        setErrorMessage(null);
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
    <div className="space-y-2">
      {isError && errorMessage && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
          {errorMessage}
        </div>
      )}
      <Button
        type="submit"
        className={`w-full ${isError ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-primary to-secondary"} text-white py-4 rounded-md flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity`}
        disabled={disabled}
      >
        {isError ? <RefreshCw className="h-5 w-5 mr-2 animate-spin" /> : <BookMarked className="h-5 w-5 mr-2" />}
        <span className="font-medium">
          {disabled ? "Génération en cours..." : isError ? "Réessayer" : "Générer mon histoire"}
        </span>
      </Button>
    </div>
  );
};

export default GenerateStoryButton;
