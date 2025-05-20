
import React from 'react';
import { Button } from "@/components/ui/button";
import { Info, Clock, Heart, BookCheck } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";

interface StoryHeaderProps {
  story: Story;
  childName?: string;
  readingTime: string;
  setShowSummary: (show: boolean) => void;
  onToggleFavorite?: (storyId: string) => void;
  onMarkAsRead?: (storyId: string) => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  childName,
  readingTime,
  setShowSummary,
  onToggleFavorite,
  onMarkAsRead,
}) => {
  const formattedDate = story.createdAt ? format(story.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : "";
  
  // Fonction pour formater l'état de lecture
  const showMarkAsReadButton = story.status === "completed" && onMarkAsRead;

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <ReactMarkdown className="text-2xl font-bold">{story.title}</ReactMarkdown>
        {childName && (
          <p className="text-muted-foreground mt-1">Histoire personnalisée pour {childName}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{readingTime}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSummary(true)}
          className="relative group transition-transform hover:scale-105"
        >
          <Info className="h-5 w-5" />
        </Button>
        
        {showMarkAsReadButton && (
          <Button 
            variant="outline" 
            onClick={() => onMarkAsRead(story.id)}
            className="transition-transform hover:scale-105 flex items-center gap-2"
            disabled={story.status === "read"}
          >
            <BookCheck className="h-5 w-5" />
            {story.status === "read" ? "Déjà lu" : "Marquer comme lu"}
          </Button>
        )}
        
        {onToggleFavorite && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onToggleFavorite(story.id)}
            className={`transition-transform hover:scale-105 ${story.isFavorite ? "text-red-500" : ""}`}
          >
            <Heart className="h-5 w-5" fill={story.isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
      </div>
    </div>
  );
};
