/**
 * Focus Mode Sidebar - Desktop only
 * Displays pinned/favorite stories for quick access
 */

import React from "react";
import type { Story } from "@/types/story";
import { Star, Clock } from "lucide-react";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FocusSidebarProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  className?: string;
}

const FocusSidebar: React.FC<FocusSidebarProps> = ({
  stories,
  onSelectStory,
  className,
}) => {
  // Get favorite stories
  const favoriteStories = stories.filter(s => s.isFavorite).slice(0, 5);

  if (favoriteStories.length === 0) {
    return (
      <div className={cn("p-4", className)}>
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          Histoires épinglées
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajoutez des histoires en favoris pour les retrouver ici.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        Histoires épinglées
      </h3>
      
      <div className="space-y-3">
        {favoriteStories.map((story) => {
          const imageUrl = getStoryImageUrl(story.image_path);
          const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: false, locale: fr });
          
          return (
            <button
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left group"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    📖
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {story.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Il y a {timeAgo}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FocusSidebar;
