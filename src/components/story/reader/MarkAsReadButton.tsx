
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookCheck, Loader2 } from "lucide-react";

interface MarkAsReadButtonProps {
  onMarkAsRead: () => void;
  isRead: boolean;
  isUpdatingReadStatus: boolean;
  isDarkMode: boolean;
}

export const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({
  onMarkAsRead,
  isRead,
  isUpdatingReadStatus,
  isDarkMode
}) => {
  return (
    <Button 
      variant={isDarkMode ? "outline" : "outline"}
      onClick={onMarkAsRead}
      className={`transition-transform hover:scale-105 flex items-center gap-2 ${
        isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
      } ${isRead ? "bg-green-100 dark:bg-green-900/30" : ""}`}
      disabled={isRead || isUpdatingReadStatus}
    >
      {isUpdatingReadStatus ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BookCheck className={`h-4 w-4 ${isRead ? "text-green-600 dark:text-green-400" : ""}`} />
      )}
      {isUpdatingReadStatus ? "En cours..." : isRead ? "Lu" : "Marquer comme lu"}
    </Button>
  );
};
