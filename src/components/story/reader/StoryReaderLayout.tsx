
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
      className="fixed inset-0 z-50 flex flex-col min-h-screen transition-colors duration-500 text-foreground bg-gradient-reader overflow-hidden"
    >
      {/* Halos d'ambiance — animation lente, n'interfère pas avec la lecture */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary-soft/15 blur-3xl animate-drift" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-drift" style={{ animationDelay: '2s' }} />
      <div className="relative flex-1 max-w-[640px] w-full mx-auto px-5 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};
