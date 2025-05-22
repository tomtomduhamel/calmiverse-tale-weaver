
import React from 'react';
import { Button } from "@/components/ui/button";
import { TextToSpeech } from "./TextToSpeech";
import { ShareStoryDialog } from "./ShareStoryDialog";
import { BookOpen, Share2, BookCheck, ArrowDown, Pause, Loader2 } from "lucide-react";

interface ReaderControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  storyId: string;
  title: string;
  story: any;
  setShowReadingGuide: (show: boolean) => void;
  onMarkAsRead?: () => void;
  isRead?: boolean;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
  autoScrollEnabled?: boolean;
  isUpdatingReadStatus?: boolean;
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
  onToggleAutoScroll,
  autoScrollEnabled = false,
  isUpdatingReadStatus = false,
}) => {
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  
  const handleDecreaseFontSize = () => {
    const newSize = Math.max(12, fontSize - 2);
    setFontSize(newSize);
  };

  const handleIncreaseFontSize = () => {
    const newSize = Math.min(24, fontSize + 2);
    setFontSize(newSize);
  };

  // Style pour les boutons en fonction du mode sombre
  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <div className="space-x-2 flex items-center flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={handleDecreaseFontSize}
        className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      >
        A-
      </Button>
      <Button
        variant="outline"
        onClick={handleIncreaseFontSize}
        className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      >
        A+
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </Button>
      <TextToSpeech text={story.story_text} isDarkMode={isDarkMode} />
      
      {/* Bouton de défilement automatique - pour activer/désactiver la fonctionnalité */}
      {autoScrollEnabled && onToggleAutoScroll && (
        <Button
          variant="outline"
          onClick={onToggleAutoScroll}
          className={`transition-transform hover:scale-105 flex items-center gap-2 ${
            isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
          } ${isAutoScrolling ? "bg-primary/10" : ""}`}
          title={isAutoScrolling ? "Arrêter défilement" : "Défilement automatique"}
        >
          {isAutoScrolling 
            ? <Pause className="h-4 w-4" /> 
            : <ArrowDown className="h-4 w-4" />
          }
          {isAutoScrolling ? "Arrêter" : "Défiler"}
        </Button>
      )}
      
      {/* Bouton Marquer comme lu - amélioré avec état de chargement et persistance d'état */}
      {onMarkAsRead && (
        <Button 
          variant={isDarkMode ? "outline" : "outline"}
          onClick={onMarkAsRead}
          className={`transition-transform hover:scale-105 flex items-center gap-2 ${
            isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
          } ${isRead ? "bg-green-100 dark:bg-green-900/30" : ""}`}
          disabled={isRead || isUpdatingReadStatus}
        >
          {isUpdatingReadStatus ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookCheck className={`h-4 w-4 ${isRead ? "text-green-600 dark:text-green-400" : ""}`} />
          )}
          {isUpdatingReadStatus ? "En cours..." : isRead ? "Lu" : "Marquer comme lu"}
        </Button>
      )}
      
      <Button
        variant="outline"
        onClick={() => setShowShareDialog(true)}
        className={`transition-transform hover:scale-105 ${buttonStyle}`}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Partager
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowReadingGuide(true)}
        className={`transition-transform hover:scale-105 ${buttonStyle}`}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Guide
      </Button>

      <ShareStoryDialog
        storyId={storyId}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </div>
  );
};
