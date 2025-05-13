
import React from "react";
import UnifiedStoryCreator from "./UnifiedStoryCreator";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

interface DirectStoryCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Composant simplifié qui utilise le nouveau UnifiedStoryCreator
 * Cette couche d'adaptation permet une intégration sans rupture de l'API existante
 */
const DirectStoryCreator: React.FC<DirectStoryCreatorProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  console.log('[DirectStoryCreator] Rendu avec', {
    childrenCount: children?.length || 0,
    onSubmitDefined: !!onSubmit,
    onCreateChildDefined: !!onCreateChild,
    onStoryCreatedDefined: !!onStoryCreated,
    timestamp: new Date().toISOString()
  });

  return (
    <UnifiedStoryCreator
      onSubmit={onSubmit}
      children={children}
      onCreateChild={onCreateChild}
      onStoryCreated={onStoryCreated}
    />
  );
};

export default DirectStoryCreator;
