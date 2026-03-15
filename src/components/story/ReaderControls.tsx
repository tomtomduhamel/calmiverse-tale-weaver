import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bookmark, CheckCircle, BookOpenCheck, Sun, Moon, Share, Copy, Check } from "lucide-react";
import { N8nAudioPlayer } from "./reader/N8nAudioPlayer";
import { TechnicalDiagnosticButton } from "./reader/TechnicalDiagnosticButton";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { ShareStoryManager } from "./ShareStoryManager";
import { useShareDialog } from "@/hooks/story/reader/useShareDialog";
import BackgroundSoundButton from "./reader/BackgroundSoundButton";
import { extractObjectiveValue } from "@/utils/objectiveUtils";
import { ReadingSpeedSelector } from "./reader/controls/ReadingSpeedSelector";
import { toast } from "@/hooks/use-toast";
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
  const [isCopied, setIsCopied] = useState(false);
  const {
    showShareDialog,
    openShareDialog,
    closeShareDialog
  } = useShareDialog();
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopyContent = () => {
    if (!story?.content) return;
    navigator.clipboard.writeText(story.content).then(() => {
      setIsCopied(true);
      toast({ title: "Texte copié dans le presse-papiers" });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
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
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          
          {/* Layout responsive : horizontal sur desktop, grille sur mobile */}
          <div className="hidden sm:flex items-center justify-center gap-3">
            {/* Desktop Layout - tout centré en une ligne */}
            
            {/* 1. Génération audio - compact */}
            <div className="shrink-0">
              <N8nAudioPlayer storyId={storyId} text={story.content} isDarkMode={isDarkMode} />
            </div>

            {/* Séparateur visuel */}
            <div className="h-8 w-px bg-border/50" />

            {/* 2. Vitesse de lecture */}
            <div className="shrink-0">
              <ReadingSpeedSelector isDarkMode={isDarkMode} />
            </div>

            {/* Séparateur visuel */}
            <div className="h-8 w-px bg-border/50" />

            {/* 3. Musique d'ambiance */}
            <div className="flex items-center gap-2 shrink-0">
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

            {/* Séparateur visuel */}
            <div className="h-8 w-px bg-border/50" />

            {/* 4. Histoire lue */}
            <div className="flex items-center gap-2 shrink-0">
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

            {/* Séparateur visuel */}
            <div className="h-8 w-px bg-border/50" />

            {/* 5. Copier le texte */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Copier
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyContent}
                title="Copier le texte de l'histoire"
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>

            {/* Séparateur visuel */}
            <div className="h-8 w-px bg-border/50" />

            {/* 6. Diagnostic technique */}
            <div className="shrink-0">
              <TechnicalDiagnosticButton isDarkMode={isDarkMode} />
            </div>
          </div>

          {/* Mobile Layout - Design minimaliste 2 lignes */}
          <div className="sm:hidden flex flex-col items-center gap-2.5 py-1">
            
            {/* Ligne 1 : Audio - centré */}
            <div className="flex items-center justify-center">
              <N8nAudioPlayer 
                storyId={storyId} 
                text={story.content} 
                isDarkMode={isDarkMode}
                compact={true}
              />
            </div>

            {/* Ligne 2 : Vitesse + Musique + Lu - tous centrés */}
            <div className="flex items-center justify-center gap-1.5">
              {/* Vitesse - icônes seules */}
              <ReadingSpeedSelector isDarkMode={isDarkMode} compact={true} />
              
              {/* Séparateur */}
              <div className="h-6 w-px bg-border/50 mx-1" />
              
              {/* Musique - icône seule */}
              <BackgroundSoundButton 
                soundId={story.sound_id} 
                storyObjective={extractObjectiveValue(story.objective) || undefined} 
                isDarkMode={isDarkMode} 
                autoPlay={false}
                compact={true}
              />
              
              {/* Marquer lu - icône seule */}
              <MarkAsReadButton 
                storyId={storyId} 
                onMarkAsRead={onMarkAsRead!} 
                isRead={isRead} 
                isUpdatingReadStatus={isUpdatingReadStatus} 
                isDarkMode={isDarkMode}
                compact={true}
              />

              {/* Copier le texte - icône seule */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyContent}
                title="Copier le texte"
              >
                {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>

        </div>
      </div>

      {/* Dialog de partage */}
      <ShareStoryManager storyId={storyId} isOpen={showShareDialog} onClose={closeShareDialog} />
    </>;
};
export default ReaderControls;