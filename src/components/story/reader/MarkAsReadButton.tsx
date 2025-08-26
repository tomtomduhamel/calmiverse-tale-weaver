
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
      variant="outline"
      onClick={handleClick}
      className={`
        transition-all duration-300 hover:scale-105 flex items-center gap-2 min-w-[40px] h-[40px]
        ${isRead 
          ? "bg-green-500 border-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25" 
          : "bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
        }
        ${isDarkMode && isRead 
          ? "bg-green-600 border-green-600 hover:bg-green-700 shadow-green-600/25" 
          : ""
        }
        ${isDarkMode && !isRead 
          ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500" 
          : ""
        }
      `}
      disabled={isUpdatingReadStatus}
    >
      {isUpdatingReadStatus ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRead ? (
        <BookCheck className="h-5 w-5" />
      ) : (
        <BookOpen className="h-5 w-5" />
      )}
    </Button>
  );
};
