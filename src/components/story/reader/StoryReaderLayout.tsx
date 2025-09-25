
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story } from "@/types/story";

interface StoryReaderLayoutProps {
  children: React.ReactNode;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const StoryReaderLayout: React.FC<StoryReaderLayoutProps> = ({
  children,
  scrollAreaRef
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col min-h-screen transition-colors duration-300 bg-background text-foreground"
    >
      <div className="flex-1 max-w-3xl mx-auto px-4 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};
