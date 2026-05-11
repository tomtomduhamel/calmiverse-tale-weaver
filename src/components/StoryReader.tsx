
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

  const readingTimeString = calculateReadingTime(story.content);

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

      {(!story.video_path && story.settings?.generateVideo) && (
        <div className="mx-4 mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl flex items-start sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            <span className="text-purple-600 dark:text-purple-300 text-lg">🪄</span>
          </div>
          <p className="text-sm text-purple-800 dark:text-purple-200 leading-snug">
            <strong className="font-medium">Votre histoire est prête !</strong> La vidéo d'introduction est en cours de création magique en arrière-plan.
          </p>
        </div>
      )}

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
