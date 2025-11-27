import React from 'react';
import { Button } from "@/components/ui/button";
import { BookCheck, BookOpen, Loader2 } from "lucide-react";
interface MarkAsReadButtonProps {
  storyId: string;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
  isRead: boolean;
  isUpdatingReadStatus: boolean;
  isDarkMode: boolean;
}
export const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({
  storyId,
  onMarkAsRead,
  isRead,
  isUpdatingReadStatus,
  isDarkMode
}) => {
  const handleClick = () => {
    console.log("[MarkAsReadButton] DEBUG: Button clicked, current isRead:", isRead);
    onMarkAsRead(storyId);
  };
  
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