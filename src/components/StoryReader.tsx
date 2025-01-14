import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Info, Clock, BookOpen } from "lucide-react";
import type { Story } from "@/types/story";
import ReactMarkdown from 'react-markdown';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TextToSpeech } from "./story/TextToSpeech";
import { ShareStory } from "./story/ShareStory";
import { SendToEreader } from "./story/SendToEreader";
import { ReadingGuide } from "./story/ReadingGuide";
import { calculateReadingTime } from "@/utils/readingTime";

interface StoryReaderProps {
  story: Story | null;
  onClose: () => void;
  onToggleFavorite?: (storyId: string) => void;
  childName?: string;
}

const StoryReader: React.FC<StoryReaderProps> = ({ story, onClose, onToggleFavorite, childName }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReadingGuide, setShowReadingGuide] = useState(false);

  if (!story) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-background">
        <Card className="p-6 text-center animate-fade-in">
          <p className="mb-4">Aucune histoire à afficher</p>
          <Button onClick={onClose}>Retour</Button>
        </Card>
      </div>
    );
  }

  const readingTime = calculateReadingTime(story.story_text);

  const getObjectiveText = (objective: Story['objective']) => {
    if (!objective) return "Objectif non défini";
    
    if (typeof objective === 'object' && objective.value) {
      return objective.value;
    }
    
    if (typeof objective === 'string') {
      return objective;
    }

    return "Objectif non défini";
  };

  const formattedDate = story.createdAt ? format(story.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : "";

  return (
    <div 
      className={`fixed inset-0 min-h-screen p-4 transition-colors duration-300 overflow-y-auto
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setFontSize((prev) => Math.max(12, prev - 2))}
              className="w-10 h-10 transition-transform hover:scale-105"
            >
              A-
            </Button>
            <Button
              variant="outline"
              onClick={() => setFontSize((prev) => Math.min(24, prev + 2))}
              className="w-10 h-10 transition-transform hover:scale-105"
            >
              A+
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="w-10 h-10 transition-transform hover:scale-105"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </Button>
            <TextToSpeech text={story.story_text} />
            <ShareStory storyId={story.id} title={story.title} />
            <SendToEreader story={story} />
            <Button
              variant="outline"
              onClick={() => setShowReadingGuide(true)}
              className="transition-transform hover:scale-105"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guide de lecture
            </Button>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="transition-transform hover:scale-105"
          >
            Fermer
          </Button>
        </div>

        <Card className={`p-6 transition-all duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"} animate-fade-in`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <ReactMarkdown className="text-2xl font-bold">{story.title}</ReactMarkdown>
              {childName && (
                <p className="text-muted-foreground mt-1">Histoire personnalisée pour {childName}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{readingTime}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSummary(true)}
                className="relative group transition-transform hover:scale-105"
              >
                <Info className="h-5 w-5" />
              </Button>
              {onToggleFavorite && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onToggleFavorite(story.id)}
                  className={`transition-transform hover:scale-105 ${story.isFavorite ? "text-red-500" : ""}`}
                >
                  <Heart className="h-5 w-5" fill={story.isFavorite ? "currentColor" : "none"} />
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6 bg-secondary/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Objectif de l'histoire</h3>
            <ReactMarkdown className="text-muted-foreground">{getObjectiveText(story.objective)}</ReactMarkdown>
          </div>

          <div
            style={{ fontSize: `${fontSize}px` }}
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert animate-fade-in"
          >
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-secondary pl-4 italic my-4" {...props} />
                ),
                em: ({ node, ...props }) => <em className="italic" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              }}
            >
              {story.story_text}
            </ReactMarkdown>
          </div>
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