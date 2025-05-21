
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Story } from "@/types/story";
import { calculateReadingTime } from "@/utils/readingTime";
import { ReaderControls } from "./story/ReaderControls";
import { StoryHeader } from "./story/StoryHeader";
import { StoryContent } from "./story/StoryContent";
import { ReadingGuide } from "./story/ReadingGuide";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "./ui/scroll-area";

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

  useEffect(() => {
    if (story && story.status === 'ready' && onMarkAsRead) {
      onMarkAsRead(story.id).catch(err => {
        console.error("[StoryReader] ERROR: Échec du marquage comme lu:", err);
      });
    }
  }, [story, onMarkAsRead]);

  // Use onBack if provided, otherwise fallback to onClose
  const handleBack = onBack || onClose || (() => {});

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
      <div className="max-w-3xl mx-auto px-4">
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
          />
          <Button 
            variant={isDarkMode ? "outline" : "ghost"} 
            onClick={handleBack}
            className={`transition-transform hover:scale-105 ${isDarkMode ? "text-white border-white hover:bg-gray-800" : ""}`}
          >
            Fermer
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)] overflow-y-auto pr-4">
          <Card className={`p-6 transition-all duration-300 mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} animate-fade-in`}>
            <StoryHeader
              story={story}
              childName={childName}
              readingTime={readingTime}
              setShowSummary={setShowSummary}
              onToggleFavorite={onToggleFavorite}
              onMarkAsRead={onMarkAsRead}
              isDarkMode={isDarkMode}
            />

            <StoryContent
              story={story}
              fontSize={fontSize}
              isDarkMode={isDarkMode}
            />
          </Card>
        </ScrollArea>

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
