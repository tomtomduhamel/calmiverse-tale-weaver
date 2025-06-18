
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { calculateReadingTime } from "@/utils/readingTime";
import { FavoriteReaderButton } from "./FavoriteReaderButton";
import type { Story } from "@/types/story";

interface StoryReaderHeaderProps {
  story: Story;
  onClose: () => void;
  onSettingsClick: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  isUpdatingFavorite?: boolean;
  isDarkMode?: boolean;
}

export const StoryReaderHeader: React.FC<StoryReaderHeaderProps> = ({
  story,
  onClose,
  onSettingsClick,
  onToggleFavorite,
  isUpdatingFavorite = false,
  isDarkMode = false
}) => {
  const readingTime = calculateReadingTime(story.content);

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };

  return (
    <header className={`sticky top-0 z-10 border-b p-4 ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={`${isDarkMode ? 'text-white hover:bg-gray-800' : ''}`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Titre et temps de lecture */}
        <div className="flex-1 mx-4 text-center">
          <h1 className={`text-lg font-semibold line-clamp-1 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {story.title}
          </h1>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {readingTime}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bouton favori */}
          {onToggleFavorite && (
            <FavoriteReaderButton
              isFavorite={story.isFavorite || false}
              onToggle={handleToggleFavorite}
              isLoading={isUpdatingFavorite}
            />
          )}
          
          {/* Bouton paramètres */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className={`${isDarkMode ? 'text-white hover:bg-gray-800' : ''}`}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
