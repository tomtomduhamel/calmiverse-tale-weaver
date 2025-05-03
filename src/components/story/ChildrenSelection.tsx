
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ChildrenSelectionProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

const ChildrenSelection = ({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
  hasError = false,
}: ChildrenSelectionProps) => {
  // Log détaillé pour le débogage de sélection d'enfants
  useEffect(() => {
    console.log("ChildrenSelection - État actuel:", {
      availableChildren: children.map(c => ({ id: c.id, name: c.name })),
      selectedIds: selectedChildrenIds,
      hasError,
      selectedCount: selectedChildrenIds.length
    });
  }, [children, selectedChildrenIds, hasError]);

  return (
    <div className="space-y-4">
      <Label className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Pour qui est cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </Label>
      {children.length > 0 ? (
        <>
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
                  onClick={() => onChildToggle(child.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChildToggle(child.id);
                    }
                  }}
                >
                  <Checkbox
                    id={`child-${child.id}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      console.log(`Toggle checkbox pour enfant ${child.name}:`, {
                        childId: child.id,
                        currentlySelected: isSelected,
                        willBecome: !isSelected,
                        currentSelectedIds: [...selectedChildrenIds]
                      });
                      onChildToggle(child.id);
                    }}
                    className={cn(
                      isSelected ? "border-primary" : ""
                    )}
                  />
                  <Label
                    htmlFor={`child-${child.id}`}
                    className={cn(
                      "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full",
                      isSelected ? "font-semibold text-primary" : ""
                    )}
                  >
                    {child.name} ({calculateAge(child.birthDate)} ans)
                    {isSelected && <span className="ml-2 text-xs text-primary">✓ Sélectionné</span>}
                  </Label>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            onClick={onCreateChildClick}
            variant="outline"
            className={cn(
              "w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors",
              hasError ? "border-destructive/50 hover:border-destructive" : ""
            )}
          >
            <UserPlus className="w-5 h-5" />
            Ajouter un autre enfant
          </Button>
        </>
      ) : (
        <Button
          type="button"
          onClick={onCreateChildClick}
          variant="outline"
          className={cn(
            "w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors",
            hasError ? "border-destructive/50 hover:border-destructive" : ""
          )}
        >
          <UserPlus className="w-5 h-5" />
          Créer un profil enfant
        </Button>
      )}
    </div>
  );
};

export default ChildrenSelection;
