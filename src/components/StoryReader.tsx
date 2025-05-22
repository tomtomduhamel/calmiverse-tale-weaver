
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { ReaderControls } from "./story/ReaderControls";
import { StoryHeader } from "./story/StoryHeader";
import { StoryContent } from "./story/StoryContent";
import { ReadingGuide } from "./story/ReadingGuide";
import { AutoScrollIndicator } from "./story/AutoScrollIndicator";
import { ScrollArea } from "./ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyStoryView } from "./story/reader/EmptyStoryView";
import { useAutoScroll } from "@/hooks/story/useAutoScroll";
import { useMarkAsRead } from "@/hooks/story/useMarkAsRead";
import { StorySummaryDialog } from "./story/reader/StorySummaryDialog";

interface StoryReaderProps {
  story: Story | null;
  onClose?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  childName?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({ 
  story: initialStory, 
  onClose, 
  onBack, 
  onToggleFavorite, 
  onMarkAsRead,
  childName 
}) => {
  // États du lecteur
  const [story, setStory] = useState<Story | null>(initialStory);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReadingGuide, setShowReadingGuide] = useState(false);
  
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Calcul des métriques pour le défilement automatique
  const wordCount = story?.story_text?.trim().split(/\s+/).length || 0;
  
  // Utiliser le hook pour la gestion du défilement automatique
  const { 
    isAutoScrolling,
    isManuallyPaused,
    autoScrollEnabled,
    toggleAutoScroll,
    handlePauseScroll,
    handleResumeScroll,
    stopAutoScroll
  } = useAutoScroll({ wordCount, scrollAreaRef });
  
  // Utiliser le hook pour la gestion du marquage comme lu
  const { isUpdatingReadStatus, handleMarkAsRead } = useMarkAsRead({
    story,
    onMarkAsRead,
    setStory
  });
  
  // Mettre à jour l'état local quand initialStory change
  useEffect(() => {
    if (initialStory) {
      setStory(initialStory);
    }
  }, [initialStory]);

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

  // Log pour débogage
  useEffect(() => {
    console.log("[StoryReader] DEBUG: Lecteur d'histoire affiché pour:", story?.id);
    
    // Désactiver le scroll du corps quand le reader est ouvert
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log("[StoryReader] DEBUG: Lecteur d'histoire fermé");
      document.body.style.overflow = '';
    };
  }, [story?.id]);

  if (!story) {
    return <EmptyStoryView onBack={handleBack} />;
  }

  const readingTime = calculateReadingTime(story.story_text);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col min-h-screen transition-colors duration-300
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="flex-1 max-w-3xl mx-auto px-4 flex flex-col h-full">
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
            onToggleAutoScroll={autoScrollEnabled ? toggleAutoScroll : undefined}
            autoScrollEnabled={autoScrollEnabled}
            isUpdatingReadStatus={isUpdatingReadStatus}
            isManuallyPaused={isManuallyPaused}
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
        {autoScrollEnabled && isAutoScrolling && !isManuallyPaused && (
          <AutoScrollIndicator
            isAutoScrolling={isAutoScrolling}
            onPauseScroll={handlePauseScroll}
            onResumeScroll={handleResumeScroll}
            isDarkMode={isDarkMode}
          />
        )}

        <StorySummaryDialog 
          story={story}
          showSummary={showSummary}
          setShowSummary={setShowSummary}
        />

        <ReadingGuide open={showReadingGuide} onOpenChange={setShowReadingGuide} />
      </div>
    </div>
  );
};

// Import manquant
import { Button } from "@/components/ui/button";

export default StoryReader;
