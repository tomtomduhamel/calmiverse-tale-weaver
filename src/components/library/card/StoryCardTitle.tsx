
import React from "react";
import { Star } from "lucide-react";
import type { Story } from "@/types/story";

interface StoryCardTitleProps {
  title: string;
  isFavorite?: boolean;
  status: Story['status'];
}

const StoryCardTitle: React.FC<StoryCardTitleProps> = ({ title, isFavorite = false, status }) => {
  return (
    <div className="flex justify-between items-start mb-2">
      <h3 className={`text-lg font-semibold truncate ${status === 'error' ? 'text-red-600' : ''}`}>
        {title || "Nouvelle histoire"}
      </h3>
      {isFavorite && (
        <Star
          className="h-5 w-5 text-amber-400 fill-amber-400 flex-shrink-0 ml-2"
          aria-label="Favori"
        />
      )}
    </div>
  );
};

export default StoryCardTitle;
