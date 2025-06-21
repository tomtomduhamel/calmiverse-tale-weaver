
import React from "react";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { ReadingGuide } from "./story/ReadingGuide";
import { AutoScrollIndicator } from "./story/AutoScrollIndicator";
import { EmptyStoryView } from "./story/reader/EmptyStoryView";
import { StorySummaryDialog } from "./story/reader/StorySummaryDialog";
import { StoryReaderLayout } from "./story/reader/StoryReaderLayout";
import { StoryReaderHeader } from "./story/reader/StoryReaderHeader";
import { StoryReaderContent } from "./story/reader/StoryReaderContent";
import { ReaderControls } from "./story/ReaderControls";
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
    showReadingGuide,
    setShowReadingGuide,
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
    handleSettingsClick,
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
