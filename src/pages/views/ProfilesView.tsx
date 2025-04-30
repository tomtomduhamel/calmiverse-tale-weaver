
import React from "react";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import type { Child } from "@/types/child";

interface ProfilesViewProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => void;
  onUpdateChild: (childId: string, updatedChild: Omit<Child, "id">) => void;
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
      <ChildrenProfiles
        children={children}
        onAddChild={onAddChild}
        onUpdateChild={onUpdateChild}
        onDeleteChild={onDeleteChild}
        onCreateStory={onCreateStory}
      />
    </div>
  );
};
