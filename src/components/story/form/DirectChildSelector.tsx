
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface DirectChildSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

/**
 * Sélecteur d'enfants simplifié avec gestion directe de l'état
 * Pour résoudre les problèmes de synchronisation
 */
const DirectChildSelector: React.FC<DirectChildSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  onCreateChildClick,
  hasError = false
}) => {
  // Journalisation pour le débogage
  useEffect(() => {
    console.log("[DirectChildSelector] Rendu avec", {
      childrenCount: children.length,
      selectedChildrenIds,
      selectedChildrenCount: selectedChildrenIds.length,
      hasError
    });
  }, [children, selectedChildrenIds, hasError]);
  
  // Gestionnaire de sélection d'enfant simplifié
  const handleSelectChild = (childId: string) => {
    console.log("[DirectChildSelector] Clic sur enfant:", childId, "État actuel:", selectedChildrenIds);
    onChildSelect(childId);
  };

  return (
    <div className="space-y-4" data-testid="child-selector">
      <div className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Pour qui est cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>
      
      {children.length > 0 ? (
        <div className={cn(
          "space-y-2",
          hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
        )}>
          {children.map((child) => {
            const isSelected = selectedChildrenIds?.includes(child.id);
            
            // Styles conditionnels pour indiquer la sélection
            const containerClass = cn(
              "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer",
              isSelected
                ? "bg-primary/10 hover:bg-primary/20" 
                : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
            );
            
            const checkboxClass = cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-all",
              isSelected 
                ? "bg-primary border-primary text-white" 
                : "border-gray-300 bg-white"
            );
            
            const textClass = cn(
              "text-base font-medium leading-none transition-all",
              isSelected ? "font-semibold text-primary" : ""
            );
            
            return (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={containerClass}
                data-testid={`child-item-${child.id}`}
                data-selected={isSelected ? "true" : "false"}
                data-child-id={child.id}
              >
                <div className="flex-shrink-0">
                  <div className={checkboxClass}>
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
                
                <div className={textClass}>
                  {child.name} ({calculateAge(child.birthDate)} ans)
                </div>
                
                {/* Badge de sélection - visible si sélectionné */}
                {isSelected && (
                  <div className="ml-auto text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                    ✓ Sélectionné
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">Aucun profil enfant disponible.</p>
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

export default DirectChildSelector;
