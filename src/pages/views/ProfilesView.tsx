
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import type { Child } from "@/types/child";

interface ProfilesViewProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>; // Mise à jour pour prendre une Promise<string>
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => void;
  onDeleteChild: (childId: string) => void;
  onCreateStory?: () => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
}) => {
  return (
    <div className="animate-fade-in">
      <ScrollArea className="h-[calc(100vh-100px)] w-full">
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
