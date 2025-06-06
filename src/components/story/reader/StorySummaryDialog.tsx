
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { Settings } from "lucide-react";
import type { Story } from "@/types/story";
import StorySettingsDialog from "./StorySettingsDialog";
import { useStoryManagement } from "@/hooks/useStoryManagement";

interface StorySummaryDialogProps {
  story: Story;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
}

export const StorySummaryDialog: React.FC<StorySummaryDialogProps> = ({
  story,
  showSummary,
  setShowSummary
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const { handleRegenerateStory } = useStoryManagement();

  return (
    <>
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[500px] animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Résumé de l'histoire</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => {
                  setShowSettings(true);
                }}
              >
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Button>
            </DialogTitle>
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
      
      {/* Dialog pour les paramètres d'histoire */}
      <StorySettingsDialog 
        story={story}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onRegenerateStory={handleRegenerateStory}
      />
    </>
  );
};
