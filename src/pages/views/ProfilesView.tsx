
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModernChildrenProfiles from "@/components/children/modern/ModernChildrenProfiles";
import type { Child } from "@/types/child";
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfilesViewProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
  onCreateStory?: (childId?: string) => void;
  storiesCountMap?: Record<string, number>;
  totalStories?: number;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
  storiesCountMap,
  totalStories,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="animate-fade-in">
      <ScrollArea className={`${isMobile ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-100px)]'} w-full px-1`}>
        <div className="max-w-7xl mx-auto p-6">
          <ModernChildrenProfiles
            children={children}
            onAddChild={onAddChild}
            onUpdateChild={onUpdateChild}
            onDeleteChild={onDeleteChild}
            onCreateStory={onCreateStory}
            storiesCountMap={storiesCountMap}
            totalStories={totalStories}
          />
        </div>
      </ScrollArea>
    </div>
  );
};
