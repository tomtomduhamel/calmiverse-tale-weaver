
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Story } from "@/types/story";

interface LibraryErrorAlertProps {
  errorStories: Story[];
  onViewErrorStories: () => void;
  onRetryStory: (storyId: string) => void;
  isRetrying: boolean;
}

const LibraryErrorAlert: React.FC<LibraryErrorAlertProps> = ({
  errorStories,
  onViewErrorStories,
  onRetryStory,
  isRetrying
}) => {
  if (errorStories.length === 0) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Histoires en erreur</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>Nous avons détecté {errorStories.length} histoire(s) qui n'ont pas pu être générées.</p>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-red-300 hover:bg-red-100"
            onClick={onViewErrorStories}
          >
            Voir les histoires en erreur
          </Button>
          {errorStories.length === 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-green-300 hover:bg-green-100 flex items-center"
              onClick={() => onRetryStory(errorStories[0].id)}
              disabled={isRetrying}
              type="button"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Réessayer cette histoire
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default LibraryErrorAlert;
