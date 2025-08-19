import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, BookOpen, Calendar, Heart, User, Cat } from "lucide-react";
import type { Child, ChildGender } from "@/types/child";
import { calculateAge, formatAge } from "@/utils/age";
import { cn } from "@/lib/utils";

interface MobileChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
  onCreateStory?: (childId: string) => void;
  storiesCount?: number;
}

const MobileChildCard: React.FC<MobileChildCardProps> = ({
  child,
  onEdit,
  onDelete,
  onCreateStory,
  storiesCount = 0
}) => {
  const age = calculateAge(child.birthDate);
  const teddyPhoto = child.teddyPhotos?.[0]?.url;
  const initials = child.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getGenderDisplay = (gender: ChildGender) => {
    switch (gender) {
      case 'boy':
        return { icon: User, color: 'text-blue-500' };
      case 'girl':
        return { icon: Heart, color: 'text-pink-500' };
      case 'pet':
        return { icon: Cat, color: 'text-orange-500' };
      default:
        return { icon: User, color: 'text-gray-500' };
    }
  };

  const genderDisplay = getGenderDisplay(child.gender);

  return (
    <Card className="bg-background/80 border-border/50 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]">
      <div className="p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border border-primary/20 flex-shrink-0">
            {teddyPhoto ? (
              <AvatarImage src={teddyPhoto} alt={`${child.teddyName || 'Doudou'} de ${child.name}`} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base leading-tight truncate pr-2">{child.name}</h3>
              
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(child)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(child.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Informations compactes */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatAge(age)}</span>
                </div>
                <genderDisplay.icon className={cn("w-3 h-3", genderDisplay.color)} />
              </div>
              
              {storiesCount > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span className="font-medium">{storiesCount}</span>
                </div>
              )}
            </div>
            
            {/* Bouton créer histoire */}
            {onCreateStory && (
              <Button
                onClick={() => onCreateStory(child.id)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs text-primary border-primary/30 hover:bg-primary/10"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Créer une histoire
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MobileChildCard;