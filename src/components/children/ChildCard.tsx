import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { Child } from "@/types/child";

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete }) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Évite de déclencher l'édition si on clique sur le bouton de suppression
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onEdit(child);
  };

  return (
    <Card 
      className="p-4 relative transition-all duration-300 cursor-pointer
        bg-gradient-to-br from-card-start to-card-end
        hover:from-card-hover-start hover:to-card-hover-end
        shadow-soft hover:shadow-soft-lg
        active:scale-98"
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary hover:text-destructive bg-white/80 hover:bg-white/90"
          onClick={() => onDelete(child.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="pt-8">
        <h3 className="text-lg font-semibold text-secondary-dark">{child.name}</h3>
        <p className="text-sm text-muted-foreground">{child.age} ans</p>
        {child.teddyName && (
          <div className="mt-2">
            <p className="text-sm font-medium text-secondary-dark">
              Doudou : {child.teddyName}
            </p>
            {child.teddyDescription && (
              <p className="text-sm text-muted-foreground">
                {child.teddyDescription}
              </p>
            )}
          </div>
        )}
        {child.imaginaryWorld && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Monde imaginaire : {child.imaginaryWorld}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChildCard;