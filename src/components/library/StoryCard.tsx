
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardTags from "./card/StoryCardTags";
import StoryCardActions from "./card/StoryCardActions";
import type { Story } from "@/types/story";

interface StoryCardProps {
  story: Story;
  onDelete: (e: React.MouseEvent) => void;
  onRetry?: (e: React.MouseEvent) => void;
  onClick: () => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onDelete,
  onRetry,
  onClick,
  isRetrying = false,
  isDeleting = false
}) => {
  // Déterminer le style de la carte en fonction du statut
  const getCardStatusClass = () => {
    switch (story.status) {
      case "error":
        return "border-red-300 bg-red-50";
      case "pending":
        return "border-amber-300 bg-amber-50";
      case "read":
        return "border-gray-300 bg-gray-50 opacity-70";
      default:
        return "border-blue-200";
    }
  };

  // Déterminer le badge de statut
  const getStatusBadge = () => {
    switch (story.status) {
      case "error":
        return <Badge variant="destructive">Erreur</Badge>;
      case "pending":
        return <Badge variant="secondary">En cours</Badge>;
      case "read":
        return <Badge variant="outline">Lue</Badge>;
      default:
        return <Badge variant="default">Prêt pour la lecture</Badge>;
    }
  };

  const isDisabled = story.status === "pending" || isRetrying || isDeleting;
  const isClickable = !isDisabled && (story.status === "completed" || story.status === "read");

  return (
    <Card
      className={`relative transition-all duration-300 h-[180px] overflow-hidden group ${
        getCardStatusClass()
      } ${isClickable ? "hover:shadow-md cursor-pointer" : "cursor-default"}`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-4 pb-0">
        <div className="flex justify-between items-start mb-2">
          <StoryCardTitle title={story.title} status={story.status} />
          <div className="flex items-center space-x-1">
            {getStatusBadge()}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-3 mb-2">
          {story.preview || "Chargement de l'aperçu..."}
        </p>

        <StoryCardTags story={story} />
      </CardContent>

      <CardFooter className="absolute bottom-0 w-full p-3 border-t bg-white/80 backdrop-blur-sm">
        <div className="w-full flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {story.childrenNames?.join(", ")}
          </span>

          <StoryCardActions 
            story={story} 
            onDelete={onDelete} 
            onRetry={onRetry}
            isRetrying={isRetrying}
            isDeleting={isDeleting}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default StoryCard;
