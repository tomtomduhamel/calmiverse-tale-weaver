import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Banner affiché en mode démo pour informer l'utilisateur
 */
export const DemoBanner = () => {
  const handleExitDemo = () => {
    window.location.href = '/';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold">🎭 Mode Démonstration</span>
            <span className="text-sm opacity-90">
              Données d'exemple uniquement - Aucune connexion requise
            </span>
          </div>
        </div>
        <Button 
          onClick={handleExitDemo}
          variant="ghost"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white flex-shrink-0"
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
};
