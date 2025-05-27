
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story } from "@/types/story";

interface StoryReaderLayoutProps {
  isDarkMode: boolean;
  children: React.ReactNode;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const StoryReaderLayout: React.FC<StoryReaderLayoutProps> = ({
  isDarkMode,
  children,
  scrollAreaRef
}) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col min-h-screen transition-colors duration-300
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="flex-1 max-w-3xl mx-auto px-4 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};
