import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, BookOpen, Calendar } from "lucide-react";
import type { Child } from "@/types/child";
import { calculateAge, formatAge } from "@/utils/age";
import { getCategoryDisplay } from "@/utils/profileCategory";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ModernChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
  onCreateStory?: (childId: string) => void;
  storiesCount?: number;
}

const ModernChildCard: React.FC<ModernChildCardProps> = ({
  child,
  onEdit,
  onDelete,
  onCreateStory,
  storiesCount = 0
}) => {
  const isMobile = useIsMobile();
  const age = calculateAge(child.birthDate);

  // Get first teddy photo or generate initials
  const teddyPhoto = child.teddyPhotos?.[0]?.url;
  const initials = child.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Get category display (icon, label, color) based on profile category
  const categoryDisplay = getCategoryDisplay(child);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-sm border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
      
      <div className="relative p-4 space-y-2">
        {/* Header with Avatar and Name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm flex-shrink-0">
              {teddyPhoto ? (
                <AvatarImage src={teddyPhoto} alt={`${child.teddyName || 'Doudou'} de ${child.name}`} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-xl leading-tight truncate">{child.name}</h3>
            </div>
          </div>

          {/* Quick Actions - Visible on hover */}
          <div className={cn(
            "flex space-x-1 transition-opacity duration-200 flex-shrink-0",
            isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(child)}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modifier le profil</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(child.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
              <Calendar className="w-3 h-3 mr-1" />
              {formatAge(age)}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <categoryDisplay.icon className={cn("w-4 h-4", categoryDisplay.color)} />
                </TooltipTrigger>
                <TooltipContent>{categoryDisplay.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {storiesCount > 0 && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {storiesCount}
            </Badge>
          )}
        </div>

        {/* Create Story Button */}
        {onCreateStory && (
          <div className="flex justify-center pt-1">
            <Button
              onClick={() => onCreateStory(child.id)}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 font-medium"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Créer une histoire
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ModernChildCard;
