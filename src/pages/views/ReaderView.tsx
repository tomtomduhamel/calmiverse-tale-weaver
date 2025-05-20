
import React from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onClose, onMarkAsRead }) => {
  return (
    <div className="animate-fade-in">
      <StoryReader 
        story={story} 
        onClose={onClose} 
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};
