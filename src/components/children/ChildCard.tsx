
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import type { Child } from "@/types/child";
import { calculateAge, formatAge } from "@/utils/age";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete }) => {
  const isMobile = useIsMobile();
  
  const age = calculateAge(child.birthDate);

  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 shadow-soft hover:shadow-soft-lg active:scale-98",
        "bg-gradient-to-br from-card-start to-card-end hover:from-card-hover-start hover:to-card-hover-end",
        isMobile ? "p-3" : "p-4"
      )}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white/80 hover:bg-white/90 text-secondary hover:text-primary"
          onClick={() => onEdit(child)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white/80 hover:bg-white/90 text-secondary hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(child.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className={cn("pt-8", isMobile ? "pt-10" : "pt-8")}>
        <h3 className="text-lg font-semibold text-secondary-dark">{child.name}</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <p className="text-sm text-muted-foreground">
                {formatAge(age)}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>Né(e) le {format(child.birthDate, 'dd MMMM yyyy', { locale: fr })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {child.teddyName && (
          <div className="mt-2">
            <p className="text-sm font-medium text-secondary-dark">
              Doudou : {child.teddyName}
            </p>
            {child.teddyDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {child.teddyDescription}
              </p>
            )}
          </div>
        )}
        
        {child.imaginaryWorld && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground line-clamp-1">
              Monde imaginaire : {child.imaginaryWorld}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChildCard;
