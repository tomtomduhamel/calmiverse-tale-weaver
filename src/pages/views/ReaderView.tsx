
import React, { useEffect } from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onClose, onMarkAsRead }) => {
  // Ajouter un log pour confirmer que ReaderView est bien monté
  useEffect(() => {
    console.log("[ReaderView] DEBUG: Histoire reçue dans ReaderView:", story.id, "status:", story.status);
    console.log("[ReaderView] DEBUG: Contenu de l'histoire:", {
      title: story.title,
      hasContent: !!story.story_text,
      contentLength: story.story_text?.length || 0
    });
  }, [story]);

  return (
    <div className="animate-fade-in">
      <StoryReader 
        story={story} 
        onClose={onClose} 
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};
