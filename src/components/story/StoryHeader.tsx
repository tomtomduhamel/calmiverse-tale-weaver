
import React from 'react';
import { Button } from "@/components/ui/button";
import { Info, Clock, Heart } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";

interface StoryHeaderProps {
  story: Story;
  childName?: string;
  readingTime: string;
  setShowSummary: (show: boolean) => void;
  onToggleFavorite?: (storyId: string) => void;
  isDarkMode?: boolean;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  childName,
  readingTime,
  setShowSummary,
  onToggleFavorite,
  isDarkMode = false,
}) => {
  const formattedDate = story.createdAt ? format(story.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : "";
  const storyImageUrl = getStoryImageUrl(story.image_path);
  
  return (
    <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
      <div className="flex-1"></div>
      <div className="text-center">
        {/* Image de couverture si disponible */}
        {storyImageUrl && (
          <div className="mb-4 flex justify-center">
            <img 
              src={storyImageUrl} 
              alt={`Illustration de ${story.title}`}
              className="w-48 h-32 object-cover rounded-lg shadow-md"
              onError={(e) => {
                // Masquer l'image si elle ne charge pas
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <ReactMarkdown className="text-2xl font-bold">{story.title}</ReactMarkdown>
        {story.childrenNames && story.childrenNames.length > 0 && (
          <p className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-muted-foreground"}`}>
            Histoire personnalisée pour {story.childrenNames.join(", ")}
          </p>
        )}
        <div className={`flex items-center justify-center gap-2 mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          <Clock className="h-4 w-4" />
          <span>{readingTime}</span>
        </div>
        <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>{formattedDate}</p>
      </div>
      <div className="flex gap-2 flex-1 justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSummary(true)}
          className={`relative group transition-transform hover:scale-105 ${
            isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
          }`}
        >
          <Info className="h-5 w-5" />
        </Button>
        
        {onToggleFavorite && (
          <Button
            variant={isDarkMode ? "outline" : "outline"}
            size="icon"
            onClick={() => onToggleFavorite(story.id)}
            className={`transition-transform hover:scale-105 ${
              story.isFavorite ? "text-red-500" : ""
            } ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : ""}`}
          >
            <Heart className="h-5 w-5" fill={story.isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
      </div>
    </div>
  );
};
