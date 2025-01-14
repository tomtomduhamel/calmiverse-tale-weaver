import React from 'react';
import { Button } from "@/components/ui/button";
import { TextToSpeech } from "./TextToSpeech";
import { ShareStory } from "./ShareStory";
import { SendToEreader } from "./SendToEreader";
import { BookOpen } from "lucide-react";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  storyId: string;
  title: string;
  story: any;
  setShowReadingGuide: (show: boolean) => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  fontSize,
  setFontSize,
  isDarkMode,
  setIsDarkMode,
  storyId,
  title,
  story,
  setShowReadingGuide,
}) => {
  const handleDecreaseFontSize = () => {
    const newSize = Math.max(12, fontSize - 2);
    setFontSize(newSize);
  };

  const handleIncreaseFontSize = () => {
    const newSize = Math.min(24, fontSize + 2);
    setFontSize(newSize);
  };

  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        onClick={handleDecreaseFontSize}
        className="w-10 h-10 transition-transform hover:scale-105"
      >
        A-
      </Button>
      <Button
        variant="outline"
        onClick={handleIncreaseFontSize}
        className="w-10 h-10 transition-transform hover:scale-105"
      >
        A+
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="w-10 h-10 transition-transform hover:scale-105"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </Button>
      <TextToSpeech text={story.story_text} />
      <ShareStory storyId={storyId} title={title} />
      <SendToEreader story={story} />
      <Button
        variant="outline"
        onClick={() => setShowReadingGuide(true)}
        className="transition-transform hover:scale-105"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Guide de lecture
      </Button>
    </div>
  );
};