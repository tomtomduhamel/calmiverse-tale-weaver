
import React, { useState } from "react";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { useReadingSpeed } from "@/contexts/ReadingSpeedContext";
import { useUserSettings } from "@/hooks/settings/useUserSettings";
import { cn } from "@/lib/utils";
import { EmptyStoryView } from "./story/reader/EmptyStoryView";
import { StorySummaryDialog } from "./story/reader/StorySummaryDialog";
import { StoryReaderLayout } from "./story/reader/StoryReaderLayout";
import { StoryReaderHeader } from "./story/reader/StoryReaderHeader";
import { StoryReaderContent } from "./story/reader/StoryReaderContent";
import ReaderControls from "./story/ReaderControls";
import { useStoryReader } from "@/hooks/story/reader/useStoryReader";

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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const { userSettings } = useUserSettings();
  const {
    // State
    story,
    fontSize,
    setFontSize,
    isDarkMode,
    setIsDarkMode,
    showSummary,
    setShowSummary,
    isUpdatingFavorite,
    scrollAreaRef,
    controlsVisible,
    toggleControls,
    isUpdatingReadStatus,
    
    // Auto scroll state
    isAutoScrolling,
    isPaused,
    isManuallyPaused,
    toggleAutoScroll,
    handlePauseScroll,
    handleResumeScroll,
    
    // Actions
    handleBack,
    handleToggleFavorite,
    handleMarkAsRead,
    handleDelete,
    isDeleting
  } = useStoryReader({
    story: initialStory,
    onClose,
    onBack,
    onToggleFavorite,
    onMarkAsRead
  });

  if (!story) {
    return <EmptyStoryView onBack={handleBack} />;
  }

  const { readingSpeed } = useReadingSpeed();
  const readingTimeString = calculateReadingTime(story.content, readingSpeed);

  return (
    <StoryReaderLayout scrollAreaRef={scrollAreaRef}>
        <StoryReaderHeader
          story={story}
          onClose={handleBack}
          onToggleFavorite={handleToggleFavorite}
          isUpdatingFavorite={isUpdatingFavorite}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isAutoScrolling={isAutoScrolling}
          isPaused={isPaused}
          isManuallyPaused={isManuallyPaused}
          onToggleAutoScroll={toggleAutoScroll}
          setShowSummary={setShowSummary}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />

      <StoryReaderContent
        story={story}
        childName={childName}
        readingTime={readingTimeString}
        fontSize={fontSize}
        isDarkMode={isDarkMode}
        setShowSummary={setShowSummary}
        scrollAreaRef={scrollAreaRef}
        onMarkAsRead={handleMarkAsRead}
        isRead={story.status === 'read'}
        isUpdatingReadStatus={isUpdatingReadStatus}
        isAutoScrolling={isAutoScrolling}
        isPaused={isPaused}
        isManuallyPaused={isManuallyPaused}
      />

      {/* 🌙 Voile d'assombrissement tamisé automatique (Mode Veilleuse Audio) */}
      <div 
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-35 bg-black/80 backdrop-blur-[0.5px] pointer-events-none transition-opacity duration-1000 ease-in-out",
          userSettings.readingPreferences?.dimScreenOnAudioPlay && isAudioPlaying
            ? "opacity-100"
            : "opacity-0"
        )}
      />

      {/* Contrôles du lecteur & Capsule Audio Zen */}
      <ReaderControls
        fontSize={fontSize}
        setFontSize={setFontSize}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        storyId={story.id}
        title={story.title}
        story={story}
        onMarkAsRead={handleMarkAsRead}
        isRead={story.status === 'read'}
        isUpdatingReadStatus={isUpdatingReadStatus}
        onAudioPlayStateChange={setIsAudioPlaying}
      />

      <StorySummaryDialog 
        story={story}
        showSummary={showSummary}
        setShowSummary={setShowSummary}
      />
    </StoryReaderLayout>
  );
};

export default StoryReader;
