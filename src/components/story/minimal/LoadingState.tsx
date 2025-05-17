
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-center text-muted-foreground">
        Chargement des données nécessaires...
      </p>
    </div>
  );
};

export default LoadingState;
