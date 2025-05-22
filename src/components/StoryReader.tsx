
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { ReaderControls } from "./story/ReaderControls";
import { StoryHeader } from "./story/StoryHeader";
import { StoryContent } from "./story/StoryContent";
import { ReadingGuide } from "./story/ReadingGuide";
import { AutoScrollIndicator } from "./story/AutoScrollIndicator";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/settings/useUserSettings";

interface StoryReaderProps {
  story: Story | null;
  onClose?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  childName?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({ 
  story, 
  onClose, 
  onBack, 
  onToggleFavorite, 
  onMarkAsRead,
  childName 
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReadingGuide, setShowReadingGuide] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const { toast } = useToast();
  const { userSettings } = useUserSettings();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number | null>(null);
  
  // Calcul des métriques pour le défilement automatique
  const wordCount = story?.story_text?.trim().split(/\s+/).length || 0;
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125;
  const autoScrollEnabled = userSettings?.readingPreferences?.autoScrollEnabled || false;
  
  // Functions pour gérer le défilement automatique
  const startAutoScroll = useCallback(() => {
    if (!scrollAreaRef.current || scrollIntervalRef.current) return;
    
    // Obtenir l'élément viewport de ScrollArea à partir de la référence
    const viewportEl = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewportEl) return;

    const contentHeight = viewportEl.scrollHeight;
    const viewportHeight = viewportEl.clientHeight;
    const scrollDistance = contentHeight - viewportHeight;
    
    // Si déjà en bas, ne pas démarrer
    if (viewportEl.scrollTop >= scrollDistance) return;

    const totalMinutesToRead = wordCount / readingSpeed;
    const totalMsToRead = totalMinutesToRead * 60 * 1000; // Convertir en millisecondes
    
    // Enregistrer le temps de départ et la position de défilement actuelle
    scrollStartTimeRef.current = Date.now();
    const startScrollTop = viewportEl.scrollTop;
    
    // Mettre à jour l'état pour afficher l'indicateur
    setIsAutoScrolling(true);
    
    // Démarrer le défilement à intervalles réguliers
    scrollIntervalRef.current = window.setInterval(() => {
      if (!viewportEl) return;
      
      const elapsedMs = Date.now() - (scrollStartTimeRef.current || 0);
      const scrollProgress = Math.min(elapsedMs / totalMsToRead, 1);
      const newScrollTop = startScrollTop + (scrollDistance - startScrollTop) * scrollProgress;
      
      // Si on atteint la fin, arrêter le défilement automatique
      if (scrollProgress >= 1) {
        stopAutoScroll();
        return;
      }
      
      viewportEl.scrollTop = newScrollTop;
    }, 16); // ~60fps
    
  }, [wordCount, readingSpeed]);
  
  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
      scrollStartTimeRef.current = null;
    }
    setIsAutoScrolling(false);
  }, []);
  
  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll]);

  // Gérer le clic sur le contenu pour arrêter/démarrer le défilement
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignorer les clics sur les boutons et éléments interactifs
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLAnchorElement ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    
    // Basculer l'état du défilement automatique
    toggleAutoScroll();
  }, [toggleAutoScroll]);
  
  // Démarrer le défilement automatique si l'option est activée
  useEffect(() => {
    if (autoScrollEnabled && !isAutoScrolling && story) {
      // Attendre un peu pour permettre au contenu de se charger complètement
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrollEnabled, story, isAutoScrolling, startAutoScroll]);
  
  // Nettoyer l'intervalle lors du démontage du composant
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Handle le marquage comme lu uniquement lors d'une action utilisateur explicite,
  // pas automatiquement à l'ouverture
  const handleMarkAsRead = async () => {
    if (story && onMarkAsRead) {
      const success = await onMarkAsRead(story.id);
      if (success) {
        toast({
          title: "Histoire marquée comme lue",
          description: "Le statut de l'histoire a été mis à jour"
        });
      }
    }
  };

  // Use onBack if provided, otherwise fallback to onClose
  const handleBack = () => {
    console.log("[StoryReader] DEBUG: Bouton Fermer cliqué");
    // S'assurer d'arrêter le défilement automatique lors de la fermeture
    stopAutoScroll();
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  // Désactiver le défilement du corps quand le reader est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!story) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-background">
        <Card className="p-6 text-center animate-fade-in">
          <p className="mb-4">Aucune histoire à afficher</p>
          <Button onClick={handleBack}>Retour</Button>
        </Card>
      </div>
    );
  }

  const readingTime = calculateReadingTime(story.story_text);

  return (
    <div 
      className={`fixed inset-0 min-h-screen transition-colors duration-300 z-50
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-3xl mx-auto px-4 flex flex-col h-screen">
        <div className="flex justify-between items-center py-4 sticky top-0 z-10" 
             style={{ backgroundColor: isDarkMode ? '#1a1a1a' : 'white' }}>
          <ReaderControls
            fontSize={fontSize}
            setFontSize={setFontSize}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            storyId={story.id}
            title={story.title}
            story={story}
            setShowReadingGuide={setShowReadingGuide}
            onMarkAsRead={handleMarkAsRead}
            isRead={story.status === "read"}
            isAutoScrolling={isAutoScrolling}
            onToggleAutoScroll={toggleAutoScroll}
            autoScrollEnabled={autoScrollEnabled}
          />
          <Button 
            variant={isDarkMode ? "outline" : "ghost"} 
            onClick={handleBack}
            className={`transition-transform hover:scale-105 ${isDarkMode ? "text-white border-gray-600 hover:bg-gray-800" : ""}`}
          >
            Fermer
          </Button>
        </div>

        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 pr-4"
          onClick={autoScrollEnabled ? handleContentClick : undefined}
        >
          <Card className={`p-6 transition-all duration-300 mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} animate-fade-in`}>
            <StoryHeader
              story={story}
              childName={childName}
              readingTime={readingTime}
              setShowSummary={setShowSummary}
              onToggleFavorite={onToggleFavorite}
              isDarkMode={isDarkMode}
            />

            <StoryContent
              story={story}
              fontSize={fontSize}
              isDarkMode={isDarkMode}
            />
          </Card>
        </ScrollArea>

        {/* Indicateur flottant pour le défilement automatique */}
        {autoScrollEnabled && (
          <AutoScrollIndicator
            isAutoScrolling={isAutoScrolling}
            onToggle={toggleAutoScroll}
            isDarkMode={isDarkMode}
          />
        )}

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="sm:max-w-[500px] animate-fade-in">
            <DialogHeader>
              <DialogTitle>Résumé de l'histoire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Points clés de l'histoire</h4>
                <ReactMarkdown className="text-sm text-muted-foreground">{story.story_summary}</ReactMarkdown>
              </div>
              {story.tags && story.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Thèmes abordés</h4>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full bg-secondary/20 text-secondary-foreground transition-all hover:scale-105"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <ReadingGuide open={showReadingGuide} onOpenChange={setShowReadingGuide} />
      </div>
    </div>
  );
};

export default StoryReader;
