import React from "react";
import ModernChildCard from "./ModernChildCard";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChildrenGridLayoutProps {
  children: Child[];
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
  onCreateStory?: (childId: string) => void;
  storiesCountMap?: Record<string, number>;
}

const ChildrenGridLayout: React.FC<ChildrenGridLayoutProps> = ({
  children,
  onEdit,
  onDelete,
  onCreateStory,
  storiesCountMap = {}
}) => {
  const isMobile = useIsMobile();

  if (children.length === 0) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Aucun enfant enregistré</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Commencez par ajouter le profil de votre enfant pour créer des histoires personnalisées et magiques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        grid gap-6 
        ${isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }
      `}
    >
      {children.map((child) => (
        <ModernChildCard
          key={child.id}
          child={child}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateStory={onCreateStory}
          storiesCount={storiesCountMap[child.id] || 0}
        />
      ))}
    </div>
  );
};

export default ChildrenGridLayout;