import React from "react";
import type { Story } from "@/types/story";

interface StoryCardTitleProps {
  title: string;
  isFavorite?: boolean;
  status: Story['status'];
}

const StoryCardTitle: React.FC<StoryCardTitleProps> = ({ title }) => {
  // Nettoyer le titre en supprimant les astérisques au début et à la fin
  const cleanTitle = title.replace(/^\*\*|\*\*$/g, "");
  
  return (
    <h3 className="font-display italic text-lg sm:text-xl text-foreground leading-snug">
      {cleanTitle || "Nouvelle histoire"}
    </h3>
  );
};

export default StoryCardTitle;