
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface RobustChildSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

/**
 * Sélecteur d'enfants robuste avec mécanismes de suivi d'état et de récupération
 */
const RobustChildSelector: React.FC<RobustChildSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  onCreateChildClick,
  hasError = false,
}) => {
  // Référence pour suivre l'état entre les rendus
  const selectionRef = useRef<Record<string, boolean>>({});
  const renderCountRef = useRef(0);
  const [domSyncedOnce, setDomSyncedOnce] = useState(false);
  
  // Maintenir une copie de l'état courant dans la référence
  useEffect(() => {
    renderCountRef.current++;
    const selectionMap: Record<string, boolean> = {};
    
    selectedChildrenIds.forEach(id => {
      selectionMap[id] = true;
    });
    
    selectionRef.current = selectionMap;
    
    console.log("[RobustChildSelector] Rendu #" + renderCountRef.current, {
      selectedIds: selectedChildrenIds,
      selectionMap,
      hasError,
      timestamp: new Date().toISOString()
    });
  }, [selectedChildrenIds, hasError]);
  
  // Synchronisation DOM-State pour garantir la cohérence
  useEffect(() => {
    // Attendre que le DOM soit stable
    const syncTimer = setTimeout(() => {
      // Pour chaque enfant, vérifier si son état visuel correspond à son état interne
      children.forEach(child => {
        const isSelectedInState = selectedChildrenIds.includes(child.id);
        
        // Trouver l'élément DOM correspondant
        const domElement = document.querySelector(`[data-child-id="${child.id}"]`);
        
        if (domElement) {
          const isSelectedInDom = domElement.getAttribute('data-selected') === 'true';
          
          // Synchroniser le DOM avec l'état si nécessaire
          if (isSelectedInState !== isSelectedInDom) {
            console.log(`[RobustChildSelector] Incohérence DOM/State pour l'enfant ${child.id}:`, {
              enfant: child.name,
              estSelectionneEtat: isSelectedInState,
              estSelectionneDOM: isSelectedInDom
            });
            
            // Mise à jour de l'attribut DOM
            domElement.setAttribute('data-selected', isSelectedInState ? 'true' : 'false');
            
            // Si c'est sélectionné dans le DOM mais pas dans l'état, forcer la sélection
            if (isSelectedInDom && !isSelectedInState) {
              console.log(`[RobustChildSelector] Forçage de la sélection de ${child.id} dans l'état`);
              onChildSelect(child.id);
            }
          }
        }
      });
      
      setDomSyncedOnce(true);
    }, 200);
    
    return () => clearTimeout(syncTimer);
  }, [children, selectedChildrenIds, onChildSelect]);

  // Gestionnaire de clic avec synchronisation d'état garantie
  const handleChildClick = (childId: string) => {
    console.log("[RobustChildSelector] Clic sur enfant:", childId, {
      isCurrentlySelected: selectionRef.current[childId] || false,
      selectedIds: selectedChildrenIds
    });
    
    // Appeler la fonction de sélection
    onChildSelect(childId);
    
    // Faire le suivi dans la référence locale
    setTimeout(() => {
      // Mise à jour immédiate de l'attribut DOM pour l'UX
      const domElement = document.querySelector(`[data-child-id="${childId}"]`);
      if (domElement) {
        // Toggle l'attribut data-selected dans le DOM
        const currentSelected = domElement.getAttribute('data-selected') === 'true';
        domElement.setAttribute('data-selected', (!currentSelected).toString());
      }
      
      // Vérification après délai court pour confirmation
      console.log("[RobustChildSelector] Vérification après sélection:", {
        childId,
        isNowSelectedInState: selectedChildrenIds.includes(childId),
        stateNow: selectedChildrenIds
      });
    }, 0);
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
                onClick={() => handleChildClick(child.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                  isSelected 
                    ? "bg-primary/10 hover:bg-primary/20" 
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                )}
                data-testid={`child-item-${child.id}`}
                data-selected={isSelected ? "true" : "false"}
                data-child-id={child.id}
              >
                <div className="flex-shrink-0">
                  <div 
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary text-white" 
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
                  "text-base font-medium leading-none",
                  isSelected ? "font-semibold text-primary" : ""
                )}>
                  {child.name} ({calculateAge(child.birthDate)} ans)
                  {isSelected && (
                    <span className="ml-2 text-xs text-primary">
                      ✓ Sélectionné
                    </span>
                  )}
                </div>
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

export default RobustChildSelector;
