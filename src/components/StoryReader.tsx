
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { ReadingGuide } from "./story/ReadingGuide";
import { AutoScrollIndicator } from "./story/AutoScrollIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyStoryView } from "./story/reader/EmptyStoryView";
import { useAutoScroll } from "@/hooks/story/useAutoScroll";
import { useMarkAsRead } from "@/hooks/story/useMarkAsRead";
import { StorySummaryDialog } from "./story/reader/StorySummaryDialog";
import { useBackgroundSound } from "@/hooks/story/sound/useBackgroundSound";
import { useUserSettings } from "@/hooks/settings/useUserSettings";
import { StoryReaderLayout } from "./story/reader/StoryReaderLayout";
import { StoryReaderHeader } from "./story/reader/StoryReaderHeader";
import { StoryReaderContent } from "./story/reader/StoryReaderContent";

interface StoryReaderProps {
  story: Story | null;
  onClose?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  childName?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({ 
  story: initialStory, 
  onClose, 
  onBack, 
  onToggleFavorite, 
  onMarkAsRead,
  childName 
}) => {
  // États du lecteur
  const [story, setStory] = useState<Story | null>(initialStory);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReadingGuide, setShowReadingGuide] = useState(false);
  
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Calcul des métriques pour le défilement automatique
  const wordCount = story?.story_text?.trim().split(/\s+/).length || 0;
  
  // Récupération des paramètres utilisateur pour la synchronisation
  const { userSettings } = useUserSettings();
  const musicSyncEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled !== false;
  
  // Hook pour gérer la musique de fond
  const backgroundSound = useBackgroundSound({
    soundId: story?.sound_id,
    storyObjective: typeof story?.objective === 'string' ? story.objective : story?.objective?.value,
    autoPlay: false
  });
  
  // Fonction de synchronisation musique/défilement
  const handleScrollStateChange = useCallback((isScrolling: boolean) => {
    if (!musicSyncEnabled || !backgroundSound.musicEnabled || !backgroundSound.soundDetails) {
      return;
    }
    
    console.log(`🎵 StoryReader: Synchronisation musique - Défilement: ${isScrolling ? 'ON' : 'OFF'}, Musique: ${backgroundSound.isPlaying ? 'ON' : 'OFF'}`);
    
    if (isScrolling && !backgroundSound.isPlaying) {
      console.log("🎵 Démarrage de la musique avec le défilement");
      backgroundSound.togglePlay();
    } else if (!isScrolling && backgroundSound.isPlaying) {
      console.log("🎵 Pause de la musique avec l'arrêt du défilement");
      backgroundSound.togglePlay();
    }
  }, [musicSyncEnabled, backgroundSound.musicEnabled, backgroundSound.soundDetails, backgroundSound.isPlaying, backgroundSound.togglePlay]);
  
  // Gestion du défilement automatique
  const { 
    isAutoScrolling,
    isPaused,
    isManuallyPaused,
    autoScrollEnabled,
    toggleAutoScroll,
    handlePauseScroll,
    handleResumeScroll,
    stopAutoScroll
  } = useAutoScroll({ 
    wordCount, 
    scrollAreaRef,
    onScrollStateChange: handleScrollStateChange
  });
  
  // Gestion du marquage comme lu
  const { isUpdatingReadStatus, handleMarkAsRead } = useMarkAsRead({
    story,
    onMarkAsRead,
    setStory
  });
  
  // Mettre à jour l'état local quand initialStory change
  useEffect(() => {
    if (initialStory) {
      setStory(initialStory);
    }
  }, [initialStory]);

  // Gestion de la fermeture
  const handleBack = () => {
    console.log("[StoryReader] DEBUG: Bouton Fermer cliqué");
    stopAutoScroll();
    if (backgroundSound.isPlaying) {
      backgroundSound.stopSound();
    }
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  // Effets de cycle de vie
  useEffect(() => {
    console.log("[StoryReader] DEBUG: Lecteur d'histoire affiché pour:", story?.id);
    console.log("[StoryReader] DEBUG: État de la musique:", {
      isPlaying: backgroundSound.isPlaying,
      isLoading: backgroundSound.isLoading,
      soundDetails: backgroundSound.soundDetails ? backgroundSound.soundDetails.title : null,
      error: backgroundSound.error
    });
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log("[StoryReader] DEBUG: Lecteur d'histoire fermé");
      document.body.style.overflow = '';
    };
  }, [story?.id, backgroundSound.isPlaying, backgroundSound.isLoading, backgroundSound.soundDetails, backgroundSound.error]);

  if (!story) {
    return <EmptyStoryView onBack={handleBack} />;
  }

  const readingTimeString = calculateReadingTime(story.story_text);

  return (
    <StoryReaderLayout isDarkMode={isDarkMode} scrollAreaRef={scrollAreaRef}>
      <StoryReaderHeader
        story={story}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setShowReadingGuide={setShowReadingGuide}
        handleMarkAsRead={handleMarkAsRead}
        isAutoScrolling={isAutoScrolling}
        isPaused={isPaused}
        isManuallyPaused={isManuallyPaused}
        onToggleAutoScroll={toggleAutoScroll}
        autoScrollEnabled={autoScrollEnabled}
        isUpdatingReadStatus={isUpdatingReadStatus}
        onBack={handleBack}
      />

      <StoryReaderContent
        story={story}
        childName={childName}
        readingTime={readingTimeString}
        fontSize={fontSize}
        isDarkMode={isDarkMode}
        setShowSummary={setShowSummary}
        onToggleFavorite={onToggleFavorite}
        scrollAreaRef={scrollAreaRef}
      />

      <AutoScrollIndicator
        isAutoScrolling={isAutoScrolling}
        isPaused={isPaused}
        onPauseScroll={handlePauseScroll}
        onResumeScroll={handleResumeScroll}
        isDarkMode={isDarkMode}
      />

      <StorySummaryDialog 
        story={story}
        showSummary={showSummary}
        setShowSummary={setShowSummary}
      />

      <ReadingGuide open={showReadingGuide} onOpenChange={setShowReadingGuide} />
    </StoryReaderLayout>
  );
};

export default StoryReader;
