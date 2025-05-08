
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

interface StoryFormDebugProps {
  debugInfo: any;
  onForceValidation?: () => void;
}

/**
 * Composant de débogage qui affiche des informations d'état du formulaire
 * Ce composant n'est visible qu'en mode développement
 */
const StoryFormDebug: React.FC<StoryFormDebugProps> = ({ 
  debugInfo, 
  onForceValidation 
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Ne pas afficher en production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3 my-4 text-xs">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center">
          <Bug className="w-4 h-4 mr-1" /> 
          Débogage du formulaire
        </h3>
        <div className="flex gap-2">
          {onForceValidation && (
            <Button 
              type="button"
              size="sm"
              variant="outline" 
              className="text-xs py-1 h-auto bg-amber-100 dark:bg-amber-900" 
              onClick={onForceValidation}
            >
              Forcer validation
            </Button>
          )}
          <Button 
            type="button"
            size="sm"
            variant="outline" 
            className="text-xs py-1 h-auto bg-amber-100 dark:bg-amber-900" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Masquer' : 'Afficher'} détails
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2">
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-800">
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          <div className="mt-2 text-amber-700 dark:text-amber-400">
            <p><strong>État de sélection:</strong> {debugInfo.selectedChildrenIds?.length || 0} enfant(s) sélectionné(s)</p>
            <p><strong>Objectif:</strong> {debugInfo.selectedObjective || 'Non sélectionné'}</p>
            <p><strong>Erreurs:</strong> {debugInfo.formError || 'Aucune'}</p>
            <p><strong>En soumission:</strong> {debugInfo.isSubmitting ? 'Oui' : 'Non'}</p>
            <p><strong>Authentifié:</strong> {debugInfo.userLoggedIn ? 'Oui' : 'Non'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryFormDebug;
