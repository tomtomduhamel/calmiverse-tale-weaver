
import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface SimpleChildSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  onCreateChildClick: () => void;
  hasError?: boolean;
}

/**
 * Composant simplifié pour la sélection des enfants sans utiliser le Checkbox de Radix UI
 * pour éviter les problèmes de boucles infinies de rendu
 */
const SimpleChildSelector: React.FC<SimpleChildSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  onCreateChildClick,
  hasError = false,
}) => {
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
                onClick={() => onChildSelect(child.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                  isSelected 
                    ? "bg-primary/10 hover:bg-primary/20" 
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                )}
                data-testid={`child-item-${child.id}`}
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

export default SimpleChildSelector;
