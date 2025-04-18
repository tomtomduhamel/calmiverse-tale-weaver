
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

interface StoryReaderProps {
  story: Story | null;
  onClose?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  childName?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({ story, onClose, onBack, onToggleFavorite, childName }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReadingGuide, setShowReadingGuide] = useState(false);

  useEffect(() => {
    console.log("Histoire reçue dans le Reader:", story);
  }, [story]);

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
      className={`fixed inset-0 min-h-screen p-4 transition-colors duration-300 overflow-y-auto
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
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
            variant="ghost" 
            onClick={handleBack}
            className="transition-transform hover:scale-105"
          >
            Fermer
          </Button>
        </div>

        <Card className={`p-6 transition-all duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"} animate-fade-in`}>
          <StoryHeader
            story={story}
            childName={childName}
            readingTime={readingTime}
            setShowSummary={setShowSummary}
            onToggleFavorite={onToggleFavorite}
          />

          <StoryContent
            story={story}
            fontSize={fontSize}
            isDarkMode={isDarkMode}
          />
        </Card>

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
