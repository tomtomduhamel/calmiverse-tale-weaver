import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Check } from "lucide-react";
import { IntegratedAudioDeck } from "./reader/IntegratedAudioDeck";
import { MarkAsReadButton } from "./reader/MarkAsReadButton";
import { ShareStoryManager } from "./ShareStoryManager";
import { useShareDialog } from "@/hooks/story/reader/useShareDialog";
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

  return (
    <>
      <div className="bg-card/90 border-t border-primary-soft/10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          
          {/* Outils de partage & copie à gauche */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 rounded-lg"
              onClick={openShareDialog}
            >
              <Share className="w-3.5 h-3.5" /> Partager
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 rounded-lg"
              onClick={handleCopyContent}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              Copier le texte
            </Button>
          </div>

          {/* Statut de lecture à droite */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Statut de lecture :
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
      </div>

      {/* 🌟 Pupitre Audio Unifié Translucide Flottant */}
      <IntegratedAudioDeck
        storyId={storyId}
        text={story.content}
        soundId={story.sound_id}
        objective={story.objective}
        isDarkMode={isDarkMode}
      />

      {/* Dialog de partage */}
      <ShareStoryManager storyId={storyId} isOpen={showShareDialog} onClose={closeShareDialog} />
    </>
  );
};

export default ReaderControls;