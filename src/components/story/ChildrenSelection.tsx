
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChildrenSelectionProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

// Composant optimisé pour éviter les rendus inutiles
const ChildrenSelection = React.memo(({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
  hasError = false,
}: ChildrenSelectionProps) => {
  const isMobile = useIsMobile();

  // Gestionnaire d'événements stable
  const handleChildClick = useCallback((childId: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation pour éviter les déclenchements multiples
    onChildToggle(childId);
  }, [onChildToggle]);

  const handleKeyDown = useCallback((childId: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChildToggle(childId);
    }
  }, [onChildToggle]);

  // Isoler le rendu du bouton d'ajout d'enfant pour éviter les re-rendus
  const AddChildButton = useCallback(() => (
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
  ), [children.length, hasError, onCreateChildClick]);

  return (
    <div className="space-y-4">
      <Label className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Pour qui est cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </Label>
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
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                  isSelected 
                    ? "bg-primary/10 hover:bg-primary/20" 
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                )}
                onClick={handleChildClick(child.id)}
                role="button"
                tabIndex={0}
                onKeyDown={handleKeyDown(child.id)}
              >
                <div className="flex-shrink-0">
                  <Checkbox
                    id={`child-${child.id}`}
                    checked={isSelected}
                    // Important: pas d'événements directs qui créeraient des boucles
                    readOnly
                  />
                </div>
                <Label
                  htmlFor={`child-${child.id}`}
                  className={cn(
                    "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full",
                    isSelected ? "font-semibold text-primary" : ""
                  )}
                >
                  {child.name} ({calculateAge(child.birthDate)} ans)
                  {isSelected && (
                    <span className={cn(
                      "ml-2 text-xs text-primary",
                      isMobile ? "block mt-1" : "inline"
                    )}>
                      ✓ Sélectionné
                    </span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      )}
      <AddChildButton />
    </div>
  );
});

ChildrenSelection.displayName = "ChildrenSelection";

export default ChildrenSelection;
