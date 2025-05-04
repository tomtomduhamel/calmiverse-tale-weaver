
import React from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingStoryProps {
  progress?: number;
}

const LoadingStory = ({ progress }: LoadingStoryProps) => {
  // Simuler une progression si aucune n'est fournie
  const [simulatedProgress, setSimulatedProgress] = React.useState(0);
  
  React.useEffect(() => {
    if (typeof progress === 'undefined') {
      const interval = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 3;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [progress]);
  
  const displayProgress = typeof progress !== 'undefined' ? progress : simulatedProgress;
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in" data-testid="loading-story">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-primary">Création de votre histoire...</h3>
        <p className="text-sm text-muted-foreground">
          Notre équipe de conteurs magiques est en train de créer une histoire unique.
          Cela peut prendre jusqu'à une minute.
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <Progress value={displayProgress} className="h-2" />
        <p className="text-xs text-right text-muted-foreground">
          {Math.round(displayProgress)}% complété
        </p>
      </div>
    </div>
  );
};

export default LoadingStory;
