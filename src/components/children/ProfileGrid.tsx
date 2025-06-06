
import React from "react";
import ChildCard from "./ChildCard";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileGridProps {
  children: Child[];
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

const ProfileGrid: React.FC<ProfileGridProps> = ({ children, onEdit, onDelete }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="grid gap-4 grid-cols-1">
      {children.map((child) => (
        <ChildCard
          key={child.id}
          child={child}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProfileGrid;
