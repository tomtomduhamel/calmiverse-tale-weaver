
import React from "react";
import { Button } from "@/components/ui/button";
import { ReaderControls } from "../ReaderControls";
import type { Story } from "@/types/story";
import BackgroundSoundButton from "./BackgroundSoundButton";

interface StoryReaderHeaderProps {
  story: Story;
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  setShowReadingGuide: (show: boolean) => void;
  handleMarkAsRead: (storyId: string) => Promise<boolean>;
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  autoScrollEnabled: boolean;
  isUpdatingReadStatus: boolean;
  onBack: () => void;
}

export const StoryReaderHeader: React.FC<StoryReaderHeaderProps> = ({
  story,
  fontSize,
  setFontSize,
  isDarkMode,
  setIsDarkMode,
  setShowReadingGuide,
  handleMarkAsRead,
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  onToggleAutoScroll,
  autoScrollEnabled,
  isUpdatingReadStatus,
  onBack
}) => {
  return (
    <div 
      className="flex justify-between items-center py-4 px-4 sticky top-0 z-10 gap-4" 
      style={{ backgroundColor: isDarkMode ? '#1a1a1a' : 'white' }}
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
        isRead={story.status === "read"}
        isAutoScrolling={isAutoScrolling}
        isPaused={isPaused}
        onToggleAutoScroll={onToggleAutoScroll}
        autoScrollEnabled={autoScrollEnabled}
        isUpdatingReadStatus={isUpdatingReadStatus}
        isManuallyPaused={isManuallyPaused}
      />
      <div className="flex items-center gap-2">
        <BackgroundSoundButton
          soundId={story.sound_id}
          storyObjective={typeof story.objective === 'string' ? story.objective : story.objective?.value}
          isDarkMode={isDarkMode}
          autoPlay={false}
        />
        <Button 
          variant={isDarkMode ? "outline" : "ghost"} 
          onClick={onBack}
          className={`transition-transform hover:scale-105 ${isDarkMode ? "text-white border-gray-600 hover:bg-gray-800" : ""}`}
        >
          Fermer
        </Button>
      </div>
    </div>
  );
};
