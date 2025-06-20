
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Download } from "lucide-react";
import { FontControls } from "./reader/FontControls";
import { ThemeToggle } from "./reader/ThemeToggle";
import { AutoScrollControl } from "./reader/AutoScrollControl";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { UtilityButtons } from "./reader/UtilityButtons";
import { ElevenLabsTextToSpeech } from "./ElevenLabsTextToSpeech";
import { VoiceSelector } from "./reader/VoiceSelector";
import type { Story } from "@/types/story";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  storyId: string;
  title: string;
  story: Story;
  setShowReadingGuide: (show: boolean) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  isRead?: boolean;
  isAutoScrolling?: boolean;
  isPaused?: boolean;
  onToggleAutoScroll?: () => void;
  autoScrollEnabled?: boolean;
  isUpdatingReadStatus?: boolean;
  isManuallyPaused?: boolean;
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
  onMarkAsRead,
  isRead = false,
  isAutoScrolling = false,
  isPaused = false,
  onToggleAutoScroll,
  autoScrollEnabled = false,
  isUpdatingReadStatus = false,
  isManuallyPaused = false,
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState('9BWtsMINqrJLrRacOk9x'); // Aria par défaut

  return (
    <Card className={`p-4 space-y-4 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white border-gray-200"
    }`}>
      {/* Contrôles de police */}
      <div>
        <FontControls
          fontSize={fontSize}
          setFontSize={setFontSize}
          isDarkMode={isDarkMode}
        />
      </div>

      <Separator className={isDarkMode ? "bg-gray-600" : ""} />

      {/* Contrôles de thème et lecture */}
      <div className="flex items-center justify-between gap-4">
        <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        <div className="flex items-center gap-2">
          <ElevenLabsTextToSpeech
            text={story.content}
            isDarkMode={isDarkMode}
            voiceId={selectedVoiceId}
          />
          
          <Button
            variant="outline"
            onClick={() => setShowReadingGuide(true)}
            className={`w-10 h-10 ${isDarkMode ? "border-gray-600 text-white hover:bg-gray-700" : ""}`}
            title="Paramètres de lecture"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className={isDarkMode ? "bg-gray-600" : ""} />

      {/* Sélecteur de voix */}
      <VoiceSelector
        selectedVoiceId={selectedVoiceId}
        onVoiceChange={setSelectedVoiceId}
        isDarkMode={isDarkMode}
      />

      <Separator className={isDarkMode ? "bg-gray-600" : ""} />

      {/* Contrôle de défilement automatique */}
      {onToggleAutoScroll && (
        <>
          <AutoScrollControl
            isAutoScrolling={isAutoScrolling}
            isPaused={isPaused}
            onToggleAutoScroll={onToggleAutoScroll}
            isDarkMode={isDarkMode}
            isManuallyPaused={isManuallyPaused}
          />
          <Separator className={isDarkMode ? "bg-gray-600" : ""} />
        </>
      )}

      {/* Actions sur l'histoire */}
      <div className="flex flex-col gap-3">
        {onMarkAsRead && (
          <MarkAsReadButton
            storyId={storyId}
            isRead={isRead}
            onMarkAsRead={onMarkAsRead}
            isUpdatingReadStatus={isUpdatingReadStatus}
            isDarkMode={isDarkMode}
          />
        )}
        
        <UtilityButtons
          setShowReadingGuide={setShowReadingGuide}
          isDarkMode={isDarkMode}
          storyId={storyId}
          title={title}
        />
      </div>
    </Card>
  );
};
