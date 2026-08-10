import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, ScrollText, Info, Moon, Sun, Trash2 } from "lucide-react";
import { calculateReadingTime } from "@/utils/readingTime";
import { FavoriteReaderButton } from "./FavoriteReaderButton";
import { ShareStoryButton } from "./ShareStoryButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Story } from "@/types/story";
interface StoryReaderHeaderProps {
  story: Story;
  onClose: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  isUpdatingFavorite?: boolean;
  isDarkMode?: boolean;
  setIsDarkMode?: (darkMode: boolean) => void;
  // Auto-scroll props
  isAutoScrolling?: boolean;
  isPaused?: boolean;
  isManuallyPaused?: boolean;
  onToggleAutoScroll?: () => void;
  setShowSummary?: (show: boolean) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}
export const StoryReaderHeader: React.FC<StoryReaderHeaderProps> = ({
  story,
  onClose,
  onToggleFavorite,
  isUpdatingFavorite = false,
  isDarkMode = false,
  setIsDarkMode,
  isAutoScrolling = false,
  isPaused = false,
  isManuallyPaused = false,
  onToggleAutoScroll,
  setShowSummary,
  onDelete,
  isDeleting = false
}) => {
  const readingTime = calculateReadingTime(story.content);
  const handleToggleFavorite = () => {
    console.log("[StoryReaderHeader] DEBUG: Clic sur bouton favoris pour histoire:", story.id);
    if (onToggleFavorite) {
      console.log("[StoryReaderHeader] DEBUG: Appel de onToggleFavorite avec storyId:", story.id, "et status:", story.isFavorite);
      onToggleFavorite(story.id, story.isFavorite || false);
    } else {
      console.log("[StoryReaderHeader] DEBUG: onToggleFavorite n'est pas défini");
    }
  };
    return <header className="sticky top-0 z-20 w-full py-2.5 mb-3 bg-background/85 backdrop-blur-xl border-b border-border/40 rounded-b-2xl transition-colors">
      <div className="flex items-center justify-between w-full px-3">
        {/* Bouton retour */}
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Titre et temps de lecture */}
        <div className="flex-1 text-center">
          
          
          
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Contrôle de défilement automatique */}
          {onToggleAutoScroll && <AutoScrollHeaderButton isAutoScrolling={isAutoScrolling} isPaused={isPaused} isManuallyPaused={isManuallyPaused} onToggleAutoScroll={onToggleAutoScroll} isDarkMode={isDarkMode} />}
          
          {/* Bouton mode sombre */}
          {setIsDarkMode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="text-muted-foreground hover:text-foreground"
              aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          
          {/* Bouton favori */}
          {onToggleFavorite && <FavoriteReaderButton isFavorite={story.isFavorite || false} onToggle={handleToggleFavorite} isLoading={isUpdatingFavorite} />}
          
          {/* Bouton info */}
          {setShowSummary && (
            <Button variant="ghost" size="sm" onClick={() => setShowSummary(true)} className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </Button>
          )}
          
          {/* Bouton partage */}
          <ShareStoryButton storyId={story.id} title={story.title} isDarkMode={isDarkMode} />

          {/* Bouton suppression */}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                  aria-label="Supprimer l'histoire"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette histoire ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. L'histoire "{story.title}" sera définitivement supprimée de votre bibliothèque.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Suppression..." : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </header>;
};

// Composant de contrôle d'auto-scroll pour le header
const AutoScrollHeaderButton: React.FC<{
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  isDarkMode: boolean;
}> = ({
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  onToggleAutoScroll,
  isDarkMode
}) => {
  const getButtonState = () => {
    if (isAutoScrolling) {
      return {
        icon: <Pause className="h-3.5 w-3.5" />,
        label: "Défilement",
        tooltip: "Arrêter le défilement automatique",
        className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-medium"
      };
    } else if (isPaused || isManuallyPaused) {
      return {
        icon: <Play className="h-3.5 w-3.5" />,
        label: "En pause",
        tooltip: "Reprendre le défilement",
        className: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
      };
    } else {
      return {
        icon: <ScrollText className="h-3.5 w-3.5" />,
        label: "Défilement",
        tooltip: "Activer le défilement automatique du conte",
        className: "text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50"
      };
    }
  };

  const { icon, label, tooltip, className } = getButtonState();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleAutoScroll} 
            className={`h-8 px-2.5 rounded-full text-xs flex items-center gap-1.5 transition-all duration-300 ${className}`} 
            aria-label={tooltip}
          >
            {icon}
            <span className="hidden xs:inline sm:inline font-sans">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};