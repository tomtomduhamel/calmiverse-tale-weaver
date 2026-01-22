
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryHeader } from "../StoryHeader";
import { StoryContent } from "../StoryContent";
import { StoryRating } from "./StoryRating";
import type { Story } from "@/types/story";

interface StoryReaderContentProps {
  story: Story;
  childName?: string;
  readingTime: string;
  fontSize: number;
  isDarkMode: boolean;
  setShowSummary: (show: boolean) => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const StoryReaderContent: React.FC<StoryReaderContentProps> = ({
  story,
  childName,
  readingTime,
  fontSize,
  isDarkMode,
  setShowSummary,
  scrollAreaRef
}) => {
  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1 pr-4"
    >
      <Card className="p-6 transition-all duration-300 mb-6 bg-card animate-fade-in">
        <StoryHeader
          story={story}
          childName={childName}
          readingTime={readingTime}
          setShowSummary={setShowSummary}
          isDarkMode={isDarkMode}
        />

        <StoryContent
          story={story}
          fontSize={fontSize}
          isDarkMode={isDarkMode}
        />

        {/* Système de notation */}
        <div className="mt-8 pt-8 border-t border-border">
          <StoryRating
            storyId={story.id}
            initialRating={story.rating}
            initialComment={story.rating_comment}
          />
        </div>
      </Card>

      {/* Padding supplémentaire pour mobile afin d'assurer l'accès au contenu final */}
      <div className="h-32 md:h-16" />
    </ScrollArea>
  );
};
