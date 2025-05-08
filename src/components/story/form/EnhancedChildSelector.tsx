
import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface EnhancedChildSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

/**
 * Sélecteur d'enfants amélioré avec débogage, rétroaction visuelle renforcée
 * et vérifications de sélection explicites
 */
const EnhancedChildSelector: React.FC<EnhancedChildSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  onCreateChildClick,
  hasError = false,
}) => {
  // Logs de débogage pour suivre les sélections
  useEffect(() => {
    console.log("[EnhancedChildSelector] Rendu avec sélection:", selectedChildrenIds);
    if (selectedChildrenIds && selectedChildrenIds.length > 0) {
      const selectedNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(c => c.name);
      
      console.log("[EnhancedChildSelector] Enfants sélectionnés:", selectedNames, "IDs:", selectedChildrenIds);
    }
  }, [selectedChildrenIds, children]);

  // Version memoïsée des ids d'enfants pour comparaison
  const availableChildrenIds = useMemo(() => 
    children.map(child => child.id), 
    [children]
  );

  // Vérification de la cohérence des sélections
  useEffect(() => {
    if (selectedChildrenIds && selectedChildrenIds.length > 0) {
      const invalidSelections = selectedChildrenIds.filter(
        id => !availableChildrenIds.includes(id)
      );
      
      if (invalidSelections.length > 0) {
        console.error("[EnhancedChildSelector] IDs d'enfants invalides détectés:", invalidSelections);
      }
    }
  }, [selectedChildrenIds, availableChildrenIds]);

  // Gestionnaire de sélection avec validation et retour visuel explicite
  const handleSelectChild = (childId: string) => {
    if (!childId) {
      console.error("[EnhancedChildSelector] Tentative de sélection avec ID vide");
      return;
    }
    
    console.log("[EnhancedChildSelector] Clic sur enfant:", childId);
    
    // Vérifier si l'enfant existe dans la liste
    const childExists = children.some(child => child.id === childId);
    if (!childExists) {
      console.error("[EnhancedChildSelector] Tentative de sélection d'un enfant inexistant:", childId);
      return;
    }
    
    onChildSelect(childId);
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Pour qui est cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>
      
      {children.length > 0 && (
        <div className={cn(
          "space-y-2",
          hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
        )}>
          {children.map((child) => {
            const isSelected = selectedChildrenIds.includes(child.id);
            
            return (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer",
                  isSelected 
                    ? "bg-primary/10 hover:bg-primary/20 ring-2 ring-primary shadow" 
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                )}
                data-testid={`child-item-${child.id}`}
                data-selected={isSelected ? "true" : "false"}
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
                  "text-base font-medium leading-none transition-all",
                  isSelected ? "font-semibold text-primary" : ""
                )}>
                  {child.name} ({calculateAge(child.birthDate)} ans)
                </div>
                
                {isSelected && (
                  <div className="ml-auto text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
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
      >
        <UserPlus className="w-5 h-5" />
        {children.length > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
      </Button>
    </div>
  );
};

export default EnhancedChildSelector;
