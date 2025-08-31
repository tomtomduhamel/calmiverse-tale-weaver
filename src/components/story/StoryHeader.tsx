import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Info, Clock, Heart, ZoomIn } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";
import { StoryImageModal } from "./reader/StoryImageModal";
interface StoryHeaderProps {
  story: Story;
  childName?: string;
  readingTime: string;
  setShowSummary: (show: boolean) => void;
  isDarkMode?: boolean;
}
export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  childName,
  readingTime,
  setShowSummary,
  isDarkMode = false
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const formattedDate = story.createdAt ? format(story.createdAt, "d MMMM yyyy 'à' HH:mm", {
    locale: fr
  }) : "";
  const storyImageUrl = getStoryImageUrl(story.image_path);
  const handleImageClick = () => {
    if (storyImageUrl) {
      setIsImageModalOpen(true);
    }
  };
  return <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
      <div className="flex-1"></div>
      <div className="text-center">
        {/* Image de couverture si disponible */}
        {storyImageUrl && <div className="mb-4 flex justify-center">
            <div className="relative group cursor-pointer transition-transform hover:scale-105" onClick={handleImageClick}>
              <img src={storyImageUrl} alt={`Illustration de ${story.title}`} className="w-48 h-32 object-cover rounded-lg shadow-md" onError={e => {
            // Masquer l'image si elle ne charge pas
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
              {/* Indicateur de zoom au survol */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>}
        {story.childrenNames && story.childrenNames.length > 0 && <p className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-muted-foreground"}`}>
            Histoire personnalisée pour {story.childrenNames.join(", ")}
          </p>}
        <div className={`flex items-center justify-center gap-2 mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          <Clock className="h-4 w-4" />
          <span>{readingTime}</span>
        </div>
        <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>{formattedDate}</p>
      </div>
      <div className="flex gap-2 flex-1 justify-end">
      </div>

      {/* Modal d'agrandissement d'image */}
      {storyImageUrl && <StoryImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={storyImageUrl} title={story.title} isDarkMode={isDarkMode} />}
    </div>;
};