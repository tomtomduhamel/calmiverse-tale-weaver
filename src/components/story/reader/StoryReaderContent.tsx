
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryHeader } from "../StoryHeader";
import { StoryContent } from "../StoryContent";
import type { Story } from "@/types/story";

interface StoryReaderContentProps {
  story: Story;
  childName?: string;
  readingTime: number;
  fontSize: number;
  isDarkMode: boolean;
  setShowSummary: (show: boolean) => void;
  onToggleFavorite?: (storyId: string) => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const StoryReaderContent: React.FC<StoryReaderContentProps> = ({
  story,
  childName,
  readingTime,
  fontSize,
  isDarkMode,
  setShowSummary,
  onToggleFavorite,
  scrollAreaRef
}) => {
  return (
    <ScrollArea 
      ref={scrollAreaRef} 
      className="flex-1 pr-4"
    >
      <Card className={`p-6 transition-all duration-300 mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} animate-fade-in`}>
        <StoryHeader
          story={story}
          childName={childName}
          readingTime={readingTime}
          setShowSummary={setShowSummary}
          onToggleFavorite={onToggleFavorite}
          isDarkMode={isDarkMode}
        />

        <StoryContent
          story={story}
          fontSize={fontSize}
          isDarkMode={isDarkMode}
        />
      </Card>
    </ScrollArea>
  );
};
