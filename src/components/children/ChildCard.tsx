import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Pencil } from "lucide-react";
import type { Child } from "@/types/child";

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete }) => {
  return (
    <Card className="p-4 relative bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-secondary"
          onClick={() => onEdit(child)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(child.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="pt-8">
        <h3 className="text-lg font-semibold text-secondary">{child.name}</h3>
        <p className="text-sm text-muted-foreground">{child.age} ans</p>
        {child.teddyName && (
          <div className="mt-2">
            <p className="text-sm font-medium text-primary">
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