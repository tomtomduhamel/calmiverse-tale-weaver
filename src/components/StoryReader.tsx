
import React from "react";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { FloatingAutoScrollButton } from "./story/reader/FloatingAutoScrollButton";
import { EmptyStoryView } from "./story/reader/EmptyStoryView";
import { StorySummaryDialog } from "./story/reader/StorySummaryDialog";
import { StoryReaderLayout } from "./story/reader/StoryReaderLayout";
import { StoryReaderHeader } from "./story/reader/StoryReaderHeader";
import { StoryReaderContent } from "./story/reader/StoryReaderContent";
import ReaderControls from "./story/ReaderControls";
import { FloatingToggleButton } from "./story/reader/controls/FloatingToggleButton";
import { CollapsibleControls } from "./story/reader/controls/CollapsibleControls";
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
    handleMarkAsRead
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

  const readingTimeString = calculateReadingTime(story.content);

  return (
    <StoryReaderLayout isDarkMode={isDarkMode} scrollAreaRef={scrollAreaRef}>
        <StoryReaderHeader
          story={story}
          onClose={handleBack}
          onToggleFavorite={handleToggleFavorite}
          isUpdatingFavorite={isUpdatingFavorite}
          isDarkMode={isDarkMode}
          isAutoScrolling={isAutoScrolling}
          isPaused={isPaused}
          isManuallyPaused={isManuallyPaused}
          onToggleAutoScroll={toggleAutoScroll}
        />

      <StoryReaderContent
        story={story}
        childName={childName}
        readingTime={readingTimeString}
        fontSize={fontSize}
        isDarkMode={isDarkMode}
        setShowSummary={setShowSummary}
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
          onMarkAsRead={handleMarkAsRead}
          isRead={story.status === 'read'}
          isUpdatingReadStatus={isUpdatingReadStatus}
        />
      </CollapsibleControls>

      {/* Bouton flottant de toggle */}
      <FloatingToggleButton
        isVisible={controlsVisible}
        onToggle={toggleControls}
        isDarkMode={isDarkMode}
      />

      {/* Nouveau bouton flottant d'auto-scroll */}
      <FloatingAutoScrollButton
        isAutoScrolling={isAutoScrolling}
        isPaused={isPaused}
        isManuallyPaused={isManuallyPaused}
        onToggleAutoScroll={toggleAutoScroll}
        isDarkMode={isDarkMode}
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
