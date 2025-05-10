
import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";

interface UnifiedChildSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
  variant?: "simple" | "enhanced";
}

/**
 * Composant unifié pour la sélection des enfants, remplaçant SimpleChildSelector et RobustChildSelector
 */
const UnifiedChildSelector: React.FC<UnifiedChildSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  onCreateChildClick,
  hasError = false,
  variant = "enhanced" // Par défaut, on utilise la version améliorée
}) => {
  const { setError } = useStoryForm();
  
  // Version memoïsée des ids d'enfants pour validation
  const availableChildrenIds = useMemo(() => 
    children.map(child => child.id), 
    [children]
  );

  // Journalisation détaillée pour le débogage à chaque rendu et changement d'état
  useEffect(() => {
    console.log("[UnifiedChildSelector] Rendu avec", {
      selectedChildrenIds: JSON.stringify(selectedChildrenIds),
      selectedCount: selectedChildrenIds?.length || 0,
      hasError,
      variant,
      timestamp: new Date().toISOString()
    });
    
    // Vérifier la validité des sélections actuelles
    if (selectedChildrenIds && selectedChildrenIds.length > 0) {
      const selectedNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(c => c.name);
      
      console.log("[UnifiedChildSelector] Enfants sélectionnés:", {
        names: selectedNames,
        ids: selectedChildrenIds
      });
      
      // Effacer automatiquement les erreurs si nous avons des enfants sélectionnés
      if (hasError) {
        console.log("[UnifiedChildSelector] Effacement d'erreur - enfants sélectionnés");
        setError(null);
      }
      
      // Vérifier la cohérence des sélections
      const invalidSelections = selectedChildrenIds.filter(
        id => !availableChildrenIds.includes(id)
      );
      
      if (invalidSelections.length > 0) {
        console.error("[UnifiedChildSelector] IDs d'enfants invalides détectés:", invalidSelections);
      }
    }
  }, [selectedChildrenIds, children, hasError, variant, availableChildrenIds, setError]);

  // Gestionnaire de sélection amélioré avec journalisation
  const handleSelectChild = (childId: string) => {
    if (!childId) {
      console.error("[UnifiedChildSelector] Tentative de sélection avec ID vide");
      return;
    }
    
    console.log("[UnifiedChildSelector] Clic sur enfant:", {
      childId,
      isAlreadySelected: selectedChildrenIds?.includes(childId),
      currentSelection: selectedChildrenIds,
    });
    
    // Vérification de l'existence de l'enfant
    const childExists = children.some(child => child.id === childId);
    if (!childExists) {
      console.error("[UnifiedChildSelector] Enfant non trouvé:", childId);
      return;
    }
    
    // Appel du gestionnaire avec journalisation
    onChildSelect(childId);
    
    // Vérification de l'état après la sélection (pour déboguer)
    setTimeout(() => {
      console.log("[UnifiedChildSelector] État après sélection:", {
        childId,
        newSelectedIds: selectedChildrenIds,
        isNowSelected: selectedChildrenIds?.includes(childId),
      });
    }, 100);
  };

  return (
    <div className="space-y-4" data-testid="child-selector" data-variant={variant}>
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
            
            // Styles conditionnels selon la variante
            const containerClass = cn(
              "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer",
              variant === "enhanced" && isSelected
                ? "bg-primary/10 hover:bg-primary/20 ring-2 ring-primary shadow"
                : isSelected 
                  ? "bg-primary/10 hover:bg-primary/20" 
                  : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
            );
            
            const checkboxClass = cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-all",
              isSelected 
                ? "bg-primary border-primary text-white" + (variant === "enhanced" ? " scale-110" : "")
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

export default UnifiedChildSelector;
