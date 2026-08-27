import React from "react";
import { IntegratedAudioDeck } from "./reader/IntegratedAudioDeck";
import { ShareStoryManager } from "./ShareStoryManager";
import { useShareDialog } from "@/hooks/story/reader/useShareDialog";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
  storyId: string;
  title: string;
  story: any;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  isRead: boolean;
  isUpdatingReadStatus: boolean;
  onAudioPlayStateChange?: (isPlaying: boolean) => void;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
  fontSize,
  setFontSize,
  isDarkMode,
  setIsDarkMode,
  storyId,
  title,
  story,
  onMarkAsRead,
  isRead,
  isUpdatingReadStatus,
  onAudioPlayStateChange
}) => {
  const {
    showShareDialog,
    openShareDialog,
    closeShareDialog
  } = useShareDialog();

  return (
    <>
      {/* 🌟 Pupitre Audio Zen Flottant */}
      <IntegratedAudioDeck
        storyId={storyId}
        text={story.content}
        soundId={story.sound_id}
        objective={story.objective}
        isDarkMode={isDarkMode}
        onPlayStateChange={onAudioPlayStateChange}
      />

      {/* Dialog de partage */}
      <ShareStoryManager storyId={storyId} isOpen={showShareDialog} onClose={closeShareDialog} />
    </>
  );
};

export default ReaderControls;