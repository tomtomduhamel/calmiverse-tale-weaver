import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Story } from "@/types/story";

interface StoryReaderProps {
  story: Story | null;
  onClose: () => void;
}

const StoryReader: React.FC<StoryReaderProps> = ({ story, onClose }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!story) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="mb-4">Aucune histoire à afficher</p>
          <Button onClick={onClose}>Retour</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setFontSize((prev) => Math.max(12, prev - 2))}
              className="w-10 h-10 dark:text-white dark:hover:text-white"
            >
              A-
            </Button>
            <Button
              variant="outline"
              onClick={() => setFontSize((prev) => Math.min(24, prev + 2))}
              className="w-10 h-10 dark:text-white dark:hover:text-white"
            >
              A+
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="w-10 h-10 dark:text-white dark:hover:text-white"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </Button>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="dark:text-white dark:hover:text-white"
          >
            Fermer
          </Button>
        </div>

        <Card className={`p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="text-2xl font-bold mb-4">{story.title}</h2>
          {story.story_summary && (
            <div className="mb-6 bg-secondary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Résumé</h3>
              <p className="text-muted-foreground">{story.story_summary}</p>
            </div>
          )}
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="prose max-w-none animate-fade-in"
          >
            {story.story_text || story.content}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoryReader;