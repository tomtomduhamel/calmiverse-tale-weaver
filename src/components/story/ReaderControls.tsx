
import React from 'react';
import { Button } from "@/components/ui/button";
import { TextToSpeech } from "./TextToSpeech";
import { FontControls } from "./reader/FontControls";
import { ThemeToggle } from "./reader/ThemeToggle";
import { AutoScrollControl } from "./reader/AutoScrollControl";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { UtilityButtons } from "./reader/UtilityButtons";
import { BackgroundSoundButton } from "./reader/BackgroundSoundButton";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  storyId: string;
  title: string;
  story: any;
  setShowReadingGuide: (show: boolean) => void;
  onMarkAsRead?: () => void;
  isRead?: boolean;
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
  isRead = false,
  isAutoScrolling = false,
  onToggleAutoScroll,
  autoScrollEnabled = false,
  isUpdatingReadStatus = false,
  isManuallyPaused = false,
}) => {
  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <div className="space-x-2 flex items-center flex-wrap gap-2">
      {/* Contrôles de la taille de police */}
      <FontControls 
        fontSize={fontSize} 
        setFontSize={setFontSize}
        isDarkMode={isDarkMode} 
      />
      
      {/* Bascule du thème clair/sombre */}
      <ThemeToggle 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
      />
      
      {/* Bouton de fond sonore */}
      <BackgroundSoundButton
        soundId={story.sound_id}
        isDarkMode={isDarkMode}
      />
      
      {/* Bouton de lecture à haute voix */}
      <TextToSpeech text={story.story_text} isDarkMode={isDarkMode} />
      
      {/* Bouton de défilement automatique */}
      {autoScrollEnabled && onToggleAutoScroll && (
        <AutoScrollControl
          isAutoScrolling={isAutoScrolling}
          isManuallyPaused={isManuallyPaused}
          onToggleAutoScroll={onToggleAutoScroll}
          isDarkMode={isDarkMode}
        />
      )}
      
      {/* Bouton Marquer comme lu */}
      {onMarkAsRead && (
        <MarkAsReadButton
          onMarkAsRead={onMarkAsRead}
          isRead={isRead}
          isUpdatingReadStatus={isUpdatingReadStatus}
          isDarkMode={isDarkMode}
        />
      )}
      
      {/* Boutons utilitaires (partage et guide) */}
      <UtilityButtons
        storyId={storyId}
        title={title}
        setShowReadingGuide={setShowReadingGuide}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
