
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
import { StoryReaderLayout } from "./story/reader/StoryReaderLayout";
import { StoryReaderHeader } from "./story/reader/StoryReaderHeader";
import { StoryReaderContent } from "./story/reader/StoryReaderContent";
import { ReaderControls } from "./story/ReaderControls";
import { FloatingToggleButton } from "./story/reader/controls/FloatingToggleButton";
import { CollapsibleControls } from "./story/reader/controls/CollapsibleControls";
import { useControlsVisibility } from "@/hooks/story/reader/useControlsVisibility";

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
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Gestion de la visibilité des contrôles (100% manuel)
  const {
    isVisible: controlsVisible,
    toggleVisibility: toggleControls
  } = useControlsVisibility({
    persistState: true
  });
  
  // Calcul des métriques pour le défilement automatique
  const wordCount = story?.content?.trim().split(/\s+/).length || 0;
  
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
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  // Gestion des paramètres
  const handleSettingsClick = () => {
    setShowReadingGuide(true);
  };

  // Gestion du toggle favori
  const handleToggleFavorite = async (storyId: string, currentFavoriteStatus: boolean) => {
    if (!onToggleFavorite) return;
    
    setIsUpdatingFavorite(true);
    try {
      await onToggleFavorite(storyId);
      // Mettre à jour l'état local
      if (story && story.id === storyId) {
        setStory({
          ...story,
          isFavorite: !currentFavoriteStatus
        });
      }
    } catch (error) {
      console.error("Erreur lors du toggle favori:", error);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  // Effets de cycle de vie
  useEffect(() => {
    console.log("[StoryReader] DEBUG: Lecteur d'histoire affiché pour:", story?.id);
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log("[StoryReader] DEBUG: Lecteur d'histoire fermé");
      document.body.style.overflow = '';
    };
  }, [story?.id]);

  if (!story) {
    return <EmptyStoryView onBack={handleBack} />;
  }

  const readingTimeString = calculateReadingTime(story.content);

  return (
    <StoryReaderLayout isDarkMode={isDarkMode} scrollAreaRef={scrollAreaRef}>
      <StoryReaderHeader
        story={story}
        onClose={handleBack}
        onSettingsClick={handleSettingsClick}
        onToggleFavorite={handleToggleFavorite}
        isUpdatingFavorite={isUpdatingFavorite}
        isDarkMode={isDarkMode}
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

      {/* Contrôles rétractables */}
      <CollapsibleControls
        isVisible={controlsVisible}
        isDarkMode={isDarkMode}
      >
        <ReaderControls
          fontSize={fontSize}
          setFontSize={setFontSize}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          storyId={story.id}
          title={story.title}
          story={story}
          setShowReadingGuide={setShowReadingGuide}
          onMarkAsRead={handleMarkAsRead}
          isRead={story.status === 'read'}
          isAutoScrolling={isAutoScrolling}
          isPaused={isPaused}
          onToggleAutoScroll={toggleAutoScroll}
          autoScrollEnabled={autoScrollEnabled}
          isUpdatingReadStatus={isUpdatingReadStatus}
          isManuallyPaused={isManuallyPaused}
        />
      </CollapsibleControls>

      {/* Bouton flottant de toggle */}
      <FloatingToggleButton
        isVisible={controlsVisible}
        onToggle={toggleControls}
        isDarkMode={isDarkMode}
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
