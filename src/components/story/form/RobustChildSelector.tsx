
import React, { useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface RobustChildSelectorProps {
  children: Child[];
  onCreateChildClick: () => void;
}

/**
 * Sélecteur d'enfants robuste avec gestion de l'état centralisée et logs détaillés
 */
const RobustChildSelector: React.FC<RobustChildSelectorProps> = ({
  children,
  onCreateChildClick,
}) => {
  const { state, handleChildSelect, updateDebugInfo } = useStoryForm();
  const { selectedChildrenIds, formError } = state;
  const isMobile = useIsMobile();
  
  // Déterminer si l'erreur concerne la sélection d'enfant
  const hasChildSelectionError = formError && 
    (formError.toLowerCase().includes('enfant') || formError.toLowerCase().includes('child'));
  
  // Journaliser chaque rendu pour faciliter le débogage
  useEffect(() => {
    console.log("[RobustChildSelector] Rendu avec:", {
      enfantsDisponibles: children.length,
      enfantsSelectionnes: selectedChildrenIds.length,
      enfantsSelectionnesIds: selectedChildrenIds,
      erreurSelection: hasChildSelectionError,
      erreur: formError,
      isMobile,
      timestamp: new Date().toISOString()
    });
    
    updateDebugInfo({
      robustChildSelectorRendered: new Date().toISOString(),
      availableChildren: children.length,
      selectedChildren: selectedChildrenIds.length,
      selectedChildrenIds: selectedChildrenIds,
      childSelectorError: hasChildSelectionError ? formError : null
    });
  }, [children, selectedChildrenIds, formError, hasChildSelectionError, isMobile, updateDebugInfo]);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("[RobustChildSelector] Clic sur 'Créer un profil d'enfant'");
    onCreateChildClick();
  };

  // Gestionnaire de sélection d'enfant avec logs détaillés
  const handleChildClick = (childId: string) => {
    console.log("[RobustChildSelector] Clic sur l'enfant:", childId, {
      estDejaSelectionne: selectedChildrenIds.includes(childId),
      selectionActuelle: selectedChildrenIds,
      timestamp: new Date().toISOString()
    });
    
    const success = handleChildSelect(childId);
    console.log(`[RobustChildSelector] Sélection ${success ? 'réussie' : 'échouée'} pour l'enfant:`, childId);
  };

  // Afficher un message quand aucun enfant n'est disponible
  if (!children || children.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-muted-foreground mb-4">
          Vous n'avez pas encore créé de profil d'enfant.
          Créez-en un pour commencer à générer des histoires.
        </p>
        <Button onClick={handleCreateClick}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Créer un profil d'enfant
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-4",
      hasChildSelectionError ? "p-3 border border-destructive/50 rounded-lg bg-destructive/5" : ""
    )}>
      <div className={cn(
        "flex justify-between items-center",
        hasChildSelectionError ? "text-destructive" : ""
      )}>
        <h2 className="text-lg font-medium">Choisir un enfant</h2>
        {hasChildSelectionError && (
          <p className="text-sm text-destructive font-medium">
            Sélection requise
          </p>
        )}
      </div>
      
      <p className={cn(
        "text-muted-foreground text-sm mb-4",
        hasChildSelectionError ? "text-destructive/80" : ""
      )}>
        Sélectionnez un ou plusieurs enfants pour personnaliser l'histoire
      </p>

      <ScrollArea className={isMobile ? "h-[180px]" : "h-auto max-h-[260px]"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {children.map((child) => {
            const isSelected = selectedChildrenIds.includes(child.id);
            const childAge = calculateAge(child.birthDate);
            
            return (
              <div
                key={child.id}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3",
                  isSelected
                    ? "bg-primary/10 border-primary/30"
                    : hasChildSelectionError 
                      ? "border-destructive/30 hover:border-destructive hover:bg-destructive/10" 
                      : "hover:bg-muted"
                )}
                onClick={() => handleChildClick(child.id)}
                data-testid={`child-selector-${child.id}`}
                data-selected={isSelected ? "true" : "false"}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected 
                    ? "bg-primary/20" 
                    : hasChildSelectionError 
                      ? "bg-destructive/10" 
                      : "bg-primary/10"
                )}>
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={cn(
                    "font-medium",
                    isSelected && "text-primary"
                  )}>
                    {child.name}
                    {isSelected && <span className="ml-2 text-xs text-primary">✓</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {childAge} ans
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={handleCreateClick}
          className={cn(
            "w-full sm:w-auto",
            hasChildSelectionError && "border-destructive/40 text-destructive hover:bg-destructive/10"
          )}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter un nouvel enfant
        </Button>
      </div>
    </div>
  );
};

export default RobustChildSelector;
