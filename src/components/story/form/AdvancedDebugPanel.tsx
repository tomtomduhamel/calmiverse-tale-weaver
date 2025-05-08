
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoryForm } from "@/contexts/StoryFormContext";

interface AdvancedDebugPanelProps {
  className?: string;
  onForceValidation?: () => void;
}

/**
 * Panneau de débogage avancé pour le formulaire d'histoire
 * Disponible uniquement en mode développement
 */
const AdvancedDebugPanel: React.FC<AdvancedDebugPanelProps> = ({
  className,
  onForceValidation
}) => {
  const [expanded, setExpanded] = useState(false);
  const [infoSection, setInfoSection] = useState<'state' | 'events' | 'selection' | 'validation'>('state');
  const { state, updateDebugInfo } = useStoryForm();
  const { debugInfo } = state;

  // Ne pas afficher en production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const forceStateUpdate = () => {
    updateDebugInfo({
      debugPanelTimestamp: new Date().toISOString(),
      debugPanelAction: 'force-update'
    });
  };
  
  return (
    <div className={cn(
      "bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3 my-4 text-xs",
      className
    )}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center">
          <Bug className="w-4 h-4 mr-1" /> 
          Débogage avancé du formulaire
        </h3>
        <div className="flex gap-2">
          <Button 
            type="button"
            size="sm"
            variant="outline" 
            className="text-xs py-1 h-auto bg-amber-100 dark:bg-amber-900" 
            onClick={forceStateUpdate}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Rafraîchir
          </Button>
          
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
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" /> 
                Masquer
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" /> 
                Afficher
              </>
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2">
          <div className="flex gap-2 mb-2">
            {(['state', 'events', 'selection', 'validation'] as const).map((section) => (
              <Button
                key={section}
                size="sm"
                variant={infoSection === section ? "default" : "outline"}
                className="text-xs py-1 h-auto"
                onClick={() => setInfoSection(section)}
              >
                {section === 'state' && 'État'}
                {section === 'events' && 'Événements'}
                {section === 'selection' && 'Sélections'}
                {section === 'validation' && 'Validation'}
              </Button>
            ))}
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-800">
            {infoSection === 'state' && (
              <div>
                <h4 className="font-semibold mb-1">État du formulaire</h4>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify({
                    selectedChildrenIds: state.selectedChildrenIds,
                    selectedChildCount: state.selectedChildrenIds.length,
                    selectedObjective: state.selectedObjective,
                    isSubmitting: state.isSubmitting,
                    formError: state.formError,
                    showChildForm: state.showChildForm
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            {infoSection === 'events' && (
              <div>
                <h4 className="font-semibold mb-1">Événements récents</h4>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify({
                    stateTimestamp: debugInfo.stateTimestamp,
                    submissionTimestamp: debugInfo.submissionTimestamp,
                    errorTimestamp: debugInfo.errorTimestamp,
                    debugPanelTimestamp: debugInfo.debugPanelTimestamp,
                    debugPanelAction: debugInfo.debugPanelAction
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            {infoSection === 'selection' && (
              <div>
                <h4 className="font-semibold mb-1">Détails des sélections</h4>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify({
                    selectedChildrenIds: state.selectedChildrenIds,
                    selectedChildNames: debugInfo.selectedChildNames || [],
                    invalidSelections: debugInfo.invalidSelections || [],
                    submittedChildrenIds: debugInfo.submittedChildrenIds || [],
                    selectedObjective: state.selectedObjective,
                    submittedObjective: debugInfo.submittedObjective
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            {infoSection === 'validation' && (
              <div>
                <h4 className="font-semibold mb-1">Validation et erreurs</h4>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify({
                    formError: state.formError,
                    errorMessage: debugInfo.errorMessage,
                    errorTimestamp: debugInfo.errorTimestamp,
                    isGenerateButtonDisabled: !state.selectedChildrenIds.length || !state.selectedObjective || state.isSubmitting,
                    validSelection: state.selectedChildrenIds.length > 0,
                    validObjective: !!state.selectedObjective
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-amber-700 dark:text-amber-400">
            <p><strong>État:</strong> {state.selectedChildrenIds?.length || 0} enfant(s), objectif: {state.selectedObjective || 'Non sélectionné'}</p>
            <p><strong>Erreurs:</strong> {state.formError || 'Aucune'}</p>
            <p><strong>Soumission:</strong> {state.isSubmitting ? 'En cours' : 'Inactive'}</p>
            <p><strong>Utilisateur:</strong> {debugInfo.userEmail || 'Inconnu'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDebugPanel;
