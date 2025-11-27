import React from 'react';
import { Button } from "@/components/ui/button";
import { BookCheck, BookOpen, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkAsReadButtonProps {
  storyId: string;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
  isRead: boolean;
  isUpdatingReadStatus: boolean;
  isDarkMode: boolean;
  compact?: boolean;
}
export const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({
  storyId,
  onMarkAsRead,
  isRead,
  isUpdatingReadStatus,
  isDarkMode,
  compact = false
}) => {
  const handleClick = () => {
    console.log("[MarkAsReadButton] DEBUG: Button clicked, current isRead:", isRead);
    onMarkAsRead(storyId);
  };
  
  // Mode compact : bouton icône seul avec tooltip
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              disabled={isUpdatingReadStatus}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              {isUpdatingReadStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRead ? (
                <BookCheck className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isUpdatingReadStatus ? 'Mise à jour...' : isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mode normal (desktop)
  return (
    <Button
      onClick={handleClick}
      disabled={isUpdatingReadStatus}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isUpdatingReadStatus ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Mise à jour...
        </>
      ) : isRead ? (
        <>
          <BookCheck className="h-4 w-4" />
          Lu
        </>
      ) : (
        <>
          <BookOpen className="h-4 w-4" />
          Marquer comme lu
        </>
      )}
    </Button>
  );
};