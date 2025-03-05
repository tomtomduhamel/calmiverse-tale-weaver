
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingStory = () => {
  console.log("Rendering LoadingStory component");
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-primary">Création de votre histoire...</h3>
        <p className="text-sm text-muted-foreground">
          Notre équipe de conteurs magiques est en train de créer une histoire unique.
          Cela peut prendre quelques instants.
        </p>
      </div>
    </div>
  );
};

export default LoadingStory;
