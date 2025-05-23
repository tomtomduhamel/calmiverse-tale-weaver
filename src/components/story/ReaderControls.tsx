
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Minus, 
  Plus, 
  Moon, 
  Sun, 
  Share2, 
  BookOpen, 
  Play, 
  Pause,
  Volume2
} from "lucide-react";
import type { Story } from "@/types/story";
import { useState } from "react";
import { FontControls } from "./reader/FontControls";
import { ThemeToggle } from "./reader/ThemeToggle";
import { UtilityButtons } from "./reader/UtilityButtons";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { AutoScrollControl } from "./reader/AutoScrollControl";
import BackgroundSoundButton from "./reader/BackgroundSoundButton";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  storyId: string;
  title: string;
  story: Story;
  setShowReadingGuide: (show: boolean) => void;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
  isRead: boolean;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
  autoScrollEnabled?: boolean;
  isUpdatingReadStatus?: boolean;
  isManuallyPaused?: boolean;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  fontSize,
  setFontSize,
  isDarkMode,
  setIsDarkMode,
  storyId,
  title,
  story,
  setShowReadingGuide,
  onMarkAsRead,
  isRead,
  isAutoScrolling,
  onToggleAutoScroll,
  autoScrollEnabled,
  isUpdatingReadStatus,
  isManuallyPaused
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Contrôles de police */}
        <FontControls 
          fontSize={fontSize}
          setFontSize={setFontSize}
          isDarkMode={isDarkMode}
        />
        
        {/* Toggle thème */}
        <ThemeToggle 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        
        {/* Fond sonore */}
        <BackgroundSoundButton 
          soundId={story.sound_id}
          storyObjective={typeof story.objective === 'string' ? story.objective : story.objective?.value}
          isDarkMode={isDarkMode}
          autoPlay={false}
        />
        
        {/* Contrôle de défilement automatique */}
        {autoScrollEnabled && (
          <AutoScrollControl
            isAutoScrolling={isAutoScrolling || false}
            onToggleAutoScroll={onToggleAutoScroll}
            isDarkMode={isDarkMode}
            isManuallyPaused={isManuallyPaused}
          />
        )}
        
        {/* Boutons utilitaires */}
        <UtilityButtons 
          setShowReadingGuide={setShowReadingGuide}
          isDarkMode={isDarkMode}
          storyId={storyId}
          title={title}
        />
        
        {/* Bouton marquer comme lu */}
        <MarkAsReadButton 
          storyId={storyId}
          onMarkAsRead={onMarkAsRead}
          isRead={isRead}
          isDarkMode={isDarkMode}
          isUpdatingReadStatus={isUpdatingReadStatus || false}
        />
      </div>
    </TooltipProvider>
  );
};
