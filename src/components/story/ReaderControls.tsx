import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bookmark, CheckCircle, BookOpenCheck, Sun, Moon, Share } from "lucide-react";
import { N8nAudioPlayer } from "./reader/N8nAudioPlayer";
import { TechnicalDiagnosticButton } from "./reader/TechnicalDiagnosticButton";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { ShareStoryDialog } from "./ShareStoryDialog";
import { useShareDialog } from "@/hooks/story/reader/useShareDialog";
import BackgroundSoundButton from "./reader/BackgroundSoundButton";
import { extractObjectiveValue } from "@/utils/objectiveUtils";
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
  isUpdatingReadStatus
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const {
    showShareDialog,
    openShareDialog,
    closeShareDialog
  } = useShareDialog();
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const handleMarkAsReadClick = async () => {
    if (onMarkAsRead) {
      await onMarkAsRead(storyId);
    }
  };
  return <>
      <div className={`${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} border-t transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Layout horizontal minimaliste avec les 3 fonctionnalités */}
          <div className="flex items-center justify-between gap-8">
            
            {/* 1. Génération audio */}
            <div className="flex-1">
              <N8nAudioPlayer storyId={storyId} text={story.content} isDarkMode={isDarkMode} />
            </div>

            {/* 2. Musique d'ambiance */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Musique d'ambiance
              </span>
              <BackgroundSoundButton 
                soundId={story.sound_id} 
                storyObjective={extractObjectiveValue(story.objective) || undefined} 
                isDarkMode={isDarkMode} 
                autoPlay={false} 
              />
            </div>

            {/* 3. Histoire lue */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}
              </span>
              <MarkAsReadButton 
                storyId={storyId} 
                onMarkAsRead={onMarkAsRead!} 
                isRead={isRead} 
                isUpdatingReadStatus={isUpdatingReadStatus} 
                isDarkMode={isDarkMode} 
              />
            </div>

            {/* Diagnostic technique (discret) */}
            <div className="ml-4">
              <TechnicalDiagnosticButton isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de partage */}
      <ShareStoryDialog storyId={storyId} isOpen={showShareDialog} onClose={closeShareDialog} />
    </>;
};
export default ReaderControls;