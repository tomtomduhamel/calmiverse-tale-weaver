
import React from "react";
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

// Composant enfant isolé pour éviter les rendus inutiles
const ChildItem = React.memo(({
  child,
  isSelected,
  onToggle,
  isMobile
}: {
  child: Child;
  isSelected: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg transition-colors",
        isSelected 
          ? "bg-primary/10 hover:bg-primary/20" 
          : "hover:bg-muted/50"
      )}
      onClick={onToggle}
      data-testid={`child-item-${child.id}`}
    >
      <div className="flex-shrink-0">
        <Checkbox
          id={`child-${child.id}`}
          checked={isSelected}
          // Utiliser le changement d'état interne du checkbox pour éviter les boucles
          onCheckedChange={onToggle}
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
});

ChildItem.displayName = "ChildItem";

// Composant isolé pour le bouton d'ajout d'enfant
const AddChildButton = React.memo(({ 
  onClick, 
  hasError, 
  childrenCount 
}: {
  onClick: () => void;
  hasError: boolean;
  childrenCount: number;
}) => (
  <Button
    type="button"
    onClick={onClick}
    variant="outline"
    className={cn(
      "w-full flex items-center justify-center gap-2 py-4 sm:py-6 border-dashed border-2 hover:border-primary transition-colors",
      hasError ? "border-destructive/50 hover:border-destructive" : ""
    )}
  >
    <UserPlus className="w-5 h-5" />
    {childrenCount > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
  </Button>
));

AddChildButton.displayName = "AddChildButton";

// Composant principal refactorisé
const ChildrenSelection = React.memo(({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
  hasError = false,
}: ChildrenSelectionProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <Label className={cn(
        "text-foreground text-lg font-medium",
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
              <ChildItem
                key={child.id}
                child={child}
                isSelected={isSelected}
                onToggle={() => onChildToggle(child.id)}
                isMobile={isMobile}
              />
            );
          })}
        </div>
      )}
      <AddChildButton 
        onClick={onCreateChildClick} 
        hasError={hasError}
        childrenCount={children.length}
      />
    </div>
  );
});

ChildrenSelection.displayName = "ChildrenSelection";

export default ChildrenSelection;
