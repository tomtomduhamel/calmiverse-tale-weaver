import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Play, Pause, ArrowDown } from "lucide-react";
import { calculateReadingTime } from "@/utils/readingTime";
import { FavoriteReaderButton } from "./FavoriteReaderButton";
import { ShareStoryButton } from "./ShareStoryButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Story } from "@/types/story";
interface StoryReaderHeaderProps {
  story: Story;
  onClose: () => void;
  onSettingsClick: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  isUpdatingFavorite?: boolean;
  isDarkMode?: boolean;
  // Auto-scroll props
  isAutoScrolling?: boolean;
  isPaused?: boolean;
  isManuallyPaused?: boolean;
  onToggleAutoScroll?: () => void;
}
export const StoryReaderHeader: React.FC<StoryReaderHeaderProps> = ({
  story,
  onClose,
  onSettingsClick,
  onToggleFavorite,
  isUpdatingFavorite = false,
  isDarkMode = false,
  isAutoScrolling = false,
  isPaused = false,
  isManuallyPaused = false,
  onToggleAutoScroll
}) => {
  const readingTime = calculateReadingTime(story.content);
  const handleToggleFavorite = () => {
    console.log("[StoryReaderHeader] DEBUG: Clic sur bouton favoris pour histoire:", story.id);
    if (onToggleFavorite) {
      console.log("[StoryReaderHeader] DEBUG: Appel de onToggleFavorite avec storyId:", story.id, "et status:", story.isFavorite);
      onToggleFavorite(story.id, story.isFavorite || false);
    } else {
      console.log("[StoryReaderHeader] DEBUG: onToggleFavorite n'est pas défini");
    }
  };
  return <header className={`sticky top-0 z-10 border-b p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Button variant="ghost" size="sm" onClick={onClose} className={`${isDarkMode ? 'text-white hover:bg-gray-800' : ''}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Titre et temps de lecture */}
        <div className="flex-1 text-center">
          
          
          
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Contrôle de défilement automatique */}
          {onToggleAutoScroll && <AutoScrollHeaderButton isAutoScrolling={isAutoScrolling} isPaused={isPaused} isManuallyPaused={isManuallyPaused} onToggleAutoScroll={onToggleAutoScroll} isDarkMode={isDarkMode} />}
          
          {/* Bouton favori */}
          {onToggleFavorite && <FavoriteReaderButton isFavorite={story.isFavorite || false} onToggle={handleToggleFavorite} isLoading={isUpdatingFavorite} />}
          
          {/* Bouton partage */}
          <ShareStoryButton storyId={story.id} title={story.title} isDarkMode={isDarkMode} />
          
          {/* Bouton paramètres */}
          <Button variant="ghost" size="sm" onClick={onSettingsClick} className={`${isDarkMode ? 'text-white hover:bg-gray-800' : ''}`}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>;
};

// Composant de contrôle d'auto-scroll pour le header
const AutoScrollHeaderButton: React.FC<{
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  isDarkMode: boolean;
}> = ({
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  onToggleAutoScroll,
  isDarkMode
}) => {
  const getButtonState = () => {
    if (isAutoScrolling) {
      return {
        icon: <Pause className="h-4 w-4" />,
        tooltip: "Arrêter le défilement",
        className: "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
      };
    } else if (isPaused || isManuallyPaused) {
      return {
        icon: <Play className="h-4 w-4" />,
        tooltip: "Reprendre le défilement",
        className: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
      };
    } else {
      return {
        icon: <ArrowDown className="h-4 w-4" />,
        tooltip: "Démarrer le défilement",
        className: isDarkMode ? "text-white hover:bg-gray-800" : ""
      };
    }
  };
  const {
    icon,
    tooltip,
    className
  } = getButtonState();
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={onToggleAutoScroll} className={`transition-transform hover:scale-105 ${className}`} aria-label={tooltip}>
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};