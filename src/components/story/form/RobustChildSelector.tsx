
import React from "react";
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
 * Sélecteur d'enfants robuste avec gestion de l'état centralisée
 */
const RobustChildSelector: React.FC<RobustChildSelectorProps> = ({
  children,
  onCreateChildClick,
}) => {
  const { state, handleChildSelect } = useStoryForm();
  const { selectedChildrenIds } = state;
  const isMobile = useIsMobile();

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateChildClick();
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
    <div>
      <h2 className="text-lg font-medium mb-2">Choisir un enfant</h2>
      <p className="text-muted-foreground text-sm mb-4">
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
                    : "hover:bg-muted"
                )}
                onClick={() => handleChildSelect(child.id)}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{child.name}</div>
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
          className="w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter un nouvel enfant
        </Button>
      </div>
    </div>
  );
};

export default RobustChildSelector;
