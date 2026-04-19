
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryHeader } from "../StoryHeader";
import { StoryContent } from "../StoryContent";
import { StoryRating } from "./StoryRating";
import { MarkAsReadButton } from "./MarkAsReadButton";
import type { Story } from "@/types/story";

interface StoryReaderContentProps {
  story: Story;
  childName?: string;
  readingTime: string;
  fontSize: number;
  isDarkMode: boolean;
  setShowSummary: (show: boolean) => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
  isRead: boolean;
  isUpdatingReadStatus: boolean;
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
}

export const StoryReaderContent: React.FC<StoryReaderContentProps> = ({
  story,
  childName,
  readingTime,
  fontSize,
  isDarkMode,
  setShowSummary,
  scrollAreaRef,
  onMarkAsRead,
  isRead,
  isUpdatingReadStatus,
  isAutoScrolling,
  isPaused,
  isManuallyPaused
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
          isAutoScrolling={isAutoScrolling}
          isPaused={isPaused}
          isManuallyPaused={isManuallyPaused}
        />

        {/* Système de notation */}
        <div className="mt-8 pt-8 border-t border-border">
          <StoryRating
            storyId={story.id}
            initialRating={story.rating}
            initialComment={story.rating_comment}
          />
        </div>

        {/* Marquer comme lue */}
        <div className="mt-6 pt-6 border-t border-border flex justify-center">
          <MarkAsReadButton
            storyId={story.id}
            onMarkAsRead={onMarkAsRead}
            isRead={isRead}
            isUpdatingReadStatus={isUpdatingReadStatus}
            isDarkMode={isDarkMode}
          />
        </div>
      </Card>

      {/* Padding supplémentaire pour mobile afin d'assurer l'accès au contenu final */}
      <div className="h-32 md:h-16" />
    </ScrollArea>
  );
};
