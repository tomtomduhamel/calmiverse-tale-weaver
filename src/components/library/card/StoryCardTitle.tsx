
import React from "react";
import { BookCheck } from "lucide-react";
import type { Story } from "@/types/story";
import { Badge } from "@/components/ui/badge";

interface StoryCardTitleProps {
  title: string;
  isFavorite?: boolean;
  status: Story['status'];
}

const StoryCardTitle: React.FC<StoryCardTitleProps> = ({ title, status }) => {
  // Nettoyer le titre en supprimant les astérisques au début et à la fin
  const cleanTitle = title.replace(/^\*\*|\*\*$/g, "");
  
  return (
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-lg font-semibold text-foreground">
        {cleanTitle || "Nouvelle histoire"}
      </h3>
      <div className="flex items-center gap-1">
        {status === 'read' && (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <BookCheck className="h-3 w-3 mr-1" />
            Lu
          </Badge>
        )}
      </div>
    </div>
  );
};

export default StoryCardTitle;
