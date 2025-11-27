
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Edit, Heart, User, Cat, Dog, Sparkles } from "lucide-react";
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

  const getGenderDisplay = (child: Child) => {
    switch (child.gender) {
      case 'boy':
        return { icon: User, label: 'Garçon', color: 'text-blue-500' };
      case 'girl':
        return { icon: Heart, label: 'Fille', color: 'text-pink-500' };
      case 'pet':
        if (child.petType === 'dog') {
          return { icon: Dog, label: 'Chien', color: 'text-orange-500' };
        } else if (child.petType === 'cat') {
          return { icon: Cat, label: 'Chat', color: 'text-orange-500' };
        } else if (child.petType === 'other' && child.petTypeCustom) {
          return { icon: Sparkles, label: child.petTypeCustom, color: 'text-orange-500' };
        }
        return { icon: Cat, label: 'Animal', color: 'text-orange-500' };
      default:
        return { icon: User, label: 'Enfant', color: 'text-gray-500' };
    }
  };

  const genderDisplay = getGenderDisplay(child);
  const isPet = child.gender === 'pet';

  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 shadow-soft hover:shadow-soft-lg active:scale-98",
        "bg-card hover:bg-card/80",
        isMobile ? "p-3" : "p-4"
      )}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-card/80 hover:bg-card/90 text-muted-foreground hover:text-primary"
          onClick={() => onEdit(child)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-card/80 hover:bg-card/90 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(child.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className={cn("pt-8", isMobile ? "pt-10" : "pt-8")}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-card-foreground">{child.name}</h3>
          <genderDisplay.icon className={cn("w-4 h-4", genderDisplay.color)} />
        </div>
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
            <p className="text-sm font-medium text-card-foreground">
              {isPet ? genderDisplay.label : 'Doudou'} : {child.teddyName}
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
