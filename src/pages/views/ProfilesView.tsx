
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import type { Child } from "@/types/child";
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfilesViewProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
  onCreateStory?: () => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="animate-fade-in">
      <ScrollArea className={`${isMobile ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-100px)]'} w-full px-1`}>
        <ChildrenProfiles
          children={children}
          onAddChild={onAddChild}
          onUpdateChild={onUpdateChild}
          onDeleteChild={onDeleteChild}
          onCreateStory={onCreateStory}
        />
      </ScrollArea>
    </div>
  );
};
