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
import { ReadingSpeedSelector } from "./reader/controls/ReadingSpeedSelector";
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
      <div className={`${isDarkMode ? 'bg-card/95' : 'bg-card/95'} border-t transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          
          {/* Layout responsive : horizontal sur desktop, grille sur mobile */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Desktop Layout - horizontal */}
            
            {/* 1. Génération audio */}
            <div className="flex-1">
              <N8nAudioPlayer storyId={storyId} text={story.content} isDarkMode={isDarkMode} />
            </div>

            {/* 2. Vitesse de lecture */}
            <ReadingSpeedSelector isDarkMode={isDarkMode} />

            {/* 3. Musique d'ambiance */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Musique
              </span>
              <BackgroundSoundButton 
                soundId={story.sound_id} 
                storyObjective={extractObjectiveValue(story.objective) || undefined} 
                isDarkMode={isDarkMode} 
                autoPlay={false} 
              />
            </div>

            {/* 4. Histoire lue */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {isRead ? 'Non lue' : 'Lue'}
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
            <div className="ml-2">
              <TechnicalDiagnosticButton isDarkMode={isDarkMode} />
            </div>
          </div>

          {/* Mobile Layout - grille compacte */}
          <div className="sm:hidden space-y-3">
            {/* Première ligne : Génération audio (pleine largeur) */}
            <div className="w-full">
              <N8nAudioPlayer storyId={storyId} text={story.content} isDarkMode={isDarkMode} />
            </div>

            {/* Vitesse de lecture - mobile */}
            <div className="flex justify-center">
              <ReadingSpeedSelector isDarkMode={isDarkMode} />
            </div>
            
            {/* Deuxième ligne : Musique d'ambiance et Histoire lue en grille 2 colonnes */}
            <div className="grid grid-cols-2 gap-4">
              {/* Musique d'ambiance - compact */}
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg border border-border/50">
                <span className="text-xs font-medium text-center text-muted-foreground">
                  Musique
                </span>
                <BackgroundSoundButton 
                  soundId={story.sound_id} 
                  storyObjective={extractObjectiveValue(story.objective) || undefined} 
                  isDarkMode={isDarkMode} 
                  autoPlay={false} 
                />
              </div>

              {/* Histoire lue - compact */}
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg border border-border/50">
                <span className="text-xs font-medium text-center text-muted-foreground">
                  {isRead ? 'Non lue' : 'Lue'}
                </span>
                <MarkAsReadButton 
                  storyId={storyId} 
                  onMarkAsRead={onMarkAsRead!} 
                  isRead={isRead} 
                  isUpdatingReadStatus={isUpdatingReadStatus} 
                  isDarkMode={isDarkMode} 
                />
              </div>
            </div>

            {/* Diagnostic technique en bas à droite - mobile */}
            <div className="flex justify-end">
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