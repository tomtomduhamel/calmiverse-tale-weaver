import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bookmark, CheckCircle, BookOpenCheck, Sun, Moon, Share } from "lucide-react";

import { N8nAudioPlayer } from "./reader/N8nAudioPlayer";
import { TechnicalDiagnosticButton } from "./reader/TechnicalDiagnosticButton";
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
  setShowReadingGuide: (show: boolean) => void;
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
  setShowReadingGuide,
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
  const handleReadingGuideClick = () => {
    setShowReadingGuide(true);
  };
  const handleMarkAsReadClick = async () => {
    if (onMarkAsRead) {
      await onMarkAsRead(storyId);
    }
  };
  return <>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t p-4 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Colonne 1: Contrôles de lecture */}
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Lecture Audio
              </h3>
              
              {/* Nouveau lecteur audio n8n */}
              <div className="p-3 border rounded bg-card">
                <N8nAudioPlayer storyId={storyId} text={story.content} isDarkMode={isDarkMode} />
              </div>

              {/* Musique de fond (compact) */}
              <div className="p-3 border rounded bg-card">
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Musique d'ambiance
                  </div>
                  <BackgroundSoundButton
                    soundId={story.sound_id}
                    storyObjective={extractObjectiveValue(story.objective) || undefined}
                    isDarkMode={isDarkMode}
                    autoPlay={false}
                  />
                </div>
              </div>
              
              {/* Auto-scroll supprimé - maintenant dans le header et bouton flottant */}
            </div>

            {/* Colonne 2: Apparence */}
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Apparence
              </h3>
              <div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="dark-mode" className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="ml-1">{isDarkMode ? 'Mode Clair' : <><Moon className="h-4 w-4 inline mr-1" />Mode Sombre</>}</span>
                  </Label>
                  <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleToggleDarkMode} />
                </div>
              </div>
              <div>
                <Label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Taille du texte
                </Label>
                <Slider defaultValue={[fontSize]} max={30} min={12} step={1} onValueChange={handleFontSizeChange} className="mt-2" />
              </div>
            </div>

            {/* Colonne 3: Options supplémentaires */}
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Options
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleReadingGuideClick} disabled={!isMounted}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Guide de lecture
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={handleMarkAsReadClick} disabled={isRead || isUpdatingReadStatus || !onMarkAsRead}>
                  {isRead ? <>
                      <BookOpenCheck className="h-4 w-4 mr-2" />
                      Marqué comme lu
                    </> : <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Marquer comme lu
                    </>}
                </Button>

                
                
                {/* Bouton de diagnostic technique */}
                <TechnicalDiagnosticButton isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de partage */}
      <ShareStoryDialog storyId={storyId} isOpen={showShareDialog} onClose={closeShareDialog} />
    </>;
};
export default ReaderControls;