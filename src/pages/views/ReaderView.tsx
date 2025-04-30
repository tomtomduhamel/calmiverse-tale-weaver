
import React from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onClose }) => {
  return (
    <div className="animate-fade-in">
      <StoryReader story={story} onClose={onClose} />
    </div>
  );
};
