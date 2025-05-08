
import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { useStoryForm } from "@/contexts/StoryFormContext";

interface RobustChildSelectorProps {
  children: Child[];
  onCreateChildClick: () => void;
  className?: string;
}

/**
 * Sélecteur d'enfants robuste avec optimisation de performance, 
 * mécanismes de validation et feedback visuel renforcé
 */
const RobustChildSelector: React.FC<RobustChildSelectorProps> = ({
  children,
  onCreateChildClick,
  className,
}) => {
  const { state, handleChildSelect, updateDebugInfo } = useStoryForm();
  const { selectedChildrenIds, formError } = state;
  
  // Déterminer si une erreur concerne la sélection d'enfant
  const hasError = formError && 
    (formError.toLowerCase().includes('enfant') || 
     formError.toLowerCase().includes('child'));
  
  // Version mémoïsée des IDs d'enfants pour une comparaison optimisée
  const availableChildrenIds = useMemo(() => 
    children.map(child => child.id), 
    [children]
  );

  // Vérification de la cohérence des sélections
  useEffect(() => {
    if (selectedChildrenIds && selectedChildrenIds.length > 0) {
      // Vérifier si tous les enfants sélectionnés existent dans la liste disponible
      const invalidSelections = selectedChildrenIds.filter(
        id => !availableChildrenIds.includes(id)
      );
      
      if (invalidSelections.length > 0) {
        console.error("[RobustChildSelector] IDs d'enfants invalides détectés:", invalidSelections);
        updateDebugInfo({
          invalidSelections,
          availableChildrenIds,
          selectedChildrenIds
        });
      }
      
      // Journaliser les noms des enfants sélectionnés pour faciliter le débogage
      const selectedNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(c => c.name);
        
      console.log("[RobustChildSelector] Enfants sélectionnés:", selectedNames);
      
      updateDebugInfo({
        selectedChildNames: selectedNames,
        selectedChildCount: selectedChildrenIds.length
      });
    }
  }, [selectedChildrenIds, availableChildrenIds, children, updateDebugInfo]);

  // Gestionnaire de sélection optimisé
  const handleSelectChild = (childId: string) => {
    console.log("[RobustChildSelector] Clic sur enfant:", childId);
    
    if (!childId) {
      console.error("[RobustChildSelector] Tentative de sélection avec ID vide");
      return;
    }
    
    // Vérifier si l'enfant existe dans la liste
    const childExists = children.some(child => child.id === childId);
    if (!childExists) {
      console.error("[RobustChildSelector] Tentative de sélection d'un enfant inexistant:", childId);
      return;
    }
    
    // Traçage de l'action
    console.log("[RobustChildSelector] Appel de handleChildSelect avec ID:", childId);
    handleChildSelect(childId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Pour qui est cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>
      
      {children.length > 0 && (
        <div 
          className={cn(
            "space-y-2",
            hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
          )}
          data-testid="children-selection-container"
        >
          {children.map((child) => {
            const isSelected = selectedChildrenIds.includes(child.id);
            
            return (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer",
                  isSelected 
                    ? "bg-primary/10 hover:bg-primary/20 ring-2 ring-primary shadow-sm" 
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50",
                  "transform transition-transform duration-150",
                  isSelected ? "scale-[1.01]" : ""
                )}
                data-testid={`child-item-${child.id}`}
                data-selected={isSelected ? "true" : "false"}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
              >
                <div className="flex-shrink-0">
                  <div 
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-primary border-primary text-white scale-110" 
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isSelected && (
                      <svg 
                        viewBox="0 0 24 24" 
                        width="16" 
                        height="16" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "flex-grow text-base font-medium leading-none transition-all",
                  isSelected ? "font-semibold text-primary" : ""
                )}>
                  {child.name} ({calculateAge(child.birthDate)} ans)
                </div>
                
                {isSelected && (
                  <div className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    ✓ Sélectionné
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <Button
        type="button"
        onClick={onCreateChildClick}
        variant="outline"
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 sm:py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors",
          hasError ? "border-destructive/50 hover:border-destructive" : ""
        )}
        data-testid="create-child-button"
      >
        <UserPlus className="w-5 h-5" />
        {children.length > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
      </Button>
    </div>
  );
};

export default RobustChildSelector;
